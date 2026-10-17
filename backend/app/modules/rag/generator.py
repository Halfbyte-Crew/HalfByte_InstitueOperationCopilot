import logging
import re
from typing import Any, Dict, List, Optional, Tuple
import httpx
import ollama
from pydantic import BaseModel, Field

from app.core.config import settings
from app.modules.rag.retriever import RetrievedPassage

logger = logging.getLogger(__name__)

INSUFFICIENT_EVIDENCE_PHRASE = (
    "The available institutional documents do not contain sufficient information to answer this question."
)


class Citation(BaseModel):
    """Citation identifying the exact official document and page number for an answer."""
    document_title: str = Field(..., description="Official document title")
    page_number: int = Field(..., ge=1, description="1-indexed physical page in the official document")
    excerpt: str = Field(..., description="Verbatim relevant passage excerpt supporting the statement")
    similarity_score: float = Field(..., description="Relevance similarity score")


class GeneratedAnswer(BaseModel):
    """Complete grounded answer object with citations and evidence verification."""
    answer: str
    citations: List[Citation] = Field(default_factory=list)
    evidence_sufficient: bool
    model_used: str


class GroundedAnswerGenerator:
    """
    Synthesizes trustworthy, evidence-grounded answers strictly constrained
    by retrieved passages, complete with verifiable document and page citations.
    """

    SYSTEM_PROMPT = (
        "You are EduPilot, the official Institute Knowledge and Policy Assistant.\n"
        "Answer the user's question using ONLY the provided official document passages.\n\n"
        "STRICT SAFETY & ACCURACY RULES:\n"
        "1. Base all factual statements strictly on the retrieved passages.\n"
        "2. NEVER fabricate, infer, or assume institutional policies, deadlines, passing marks, or fees.\n"
        f"3. If the retrieved passages do not contain sufficient evidence to answer the question, state:\n"
        f"   '{INSUFFICIENT_EVIDENCE_PHRASE}' and direct the user to the appropriate administrative office.\n"
        "4. Provide a clear, well-structured, professional explanation.\n"
        "5. If two retrieved passages conflict (e.g., across document versions or notices), explicitly identify both versions and note the discrepancy."
    )

    def __init__(
        self,
        ollama_model: Optional[str] = None,
        timeout: float = 3.0,
    ):
        self.ollama_model = ollama_model or getattr(settings, "OLLAMA_GENERATION_MODEL", "qwen2.5:3b")
        self.ollama_client = ollama.Client(host=settings.OLLAMA_BASE_URL, timeout=timeout)
        self.timeout = timeout
        self._ollama_available: Optional[bool] = None

    async def generate(
        self,
        query: str,
        passages: List[RetrievedPassage],
        user_role: Optional[str] = None,
    ) -> GeneratedAnswer:
        """
        Generate a grounded response from retrieved passages.
        """
        if not passages:
            return GeneratedAnswer(
                answer=f"{INSUFFICIENT_EVIDENCE_PHRASE} Please consult your department coordinator or the student affairs office.",
                citations=[],
                evidence_sufficient=False,
                model_used="rule-based-abstention",
            )

        # 1. Deduplicate and collect clean citations
        citations: List[Citation] = []
        seen_citations = set()
        for p in passages:
            cit_key = (p.document_title, p.page_number)
            if cit_key not in seen_citations:
                seen_citations.add(cit_key)
                clean_lines = [l.strip() for l in p.content.splitlines() if l.strip() and not l.strip().startswith("#")]
                first_meaningful = clean_lines[0] if clean_lines else p.content[:150]
                excerpt = first_meaningful[:200] + ("..." if len(first_meaningful) > 200 else "")
                citations.append(
                    Citation(
                        document_title=p.document_title,
                        page_number=p.page_number,
                        excerpt=excerpt,
                        similarity_score=p.similarity_score,
                    )
                )

        # 2. Format context for LLM
        context_blocks = []
        for idx, p in enumerate(passages, start=1):
            context_blocks.append(
                f"[Source {idx}]: {p.document_title} (Page {p.page_number})\n{p.content}\n"
            )
        formatted_context = "\n---\n".join(context_blocks)

        user_prompt = (
            f"Question: {query}\n\n"
            f"Official Document Passages:\n{formatted_context}\n\n"
            "Based strictly on the passages above, provide a clear, coherent, and professional answer."
        )

        # 3. Attempt Generation via live Ollama if available
        if self._ollama_available is not False:
            try:
                ollama_ans = self._call_ollama(user_prompt)
                if ollama_ans:
                    self._ollama_available = True
                    return GeneratedAnswer(
                        answer=ollama_ans,
                        citations=citations,
                        evidence_sufficient=INSUFFICIENT_EVIDENCE_PHRASE.lower() not in ollama_ans.lower(),
                        model_used=f"ollama:{self.ollama_model}",
                    )
            except Exception:
                self._ollama_available = False

        # 4. Attempt Generation via OpenAI if API key configured
        if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip():
            try:
                openai_ans = await self._call_openai(user_prompt)
                if openai_ans:
                    return GeneratedAnswer(
                        answer=openai_ans,
                        citations=citations,
                        evidence_sufficient=INSUFFICIENT_EVIDENCE_PHRASE.lower() not in openai_ans.lower(),
                        model_used=f"openai:{settings.OPENAI_MODEL}",
                    )
            except Exception as exc:
                logger.warning(f"OpenAI generation failed: {exc}")

        # 5. High-Precision Coherent Fallback Synthesizer
        fallback_ans, is_sufficient = self._synthesize_coherent_fallback(query, passages)
        return GeneratedAnswer(
            answer=fallback_ans,
            citations=citations if is_sufficient else [],
            evidence_sufficient=is_sufficient,
            model_used="edupilot-grounded-synthesizer",
        )

    def _call_ollama(self, prompt: str) -> Optional[str]:
        """Call local Ollama model if running."""
        try:
            res = self.ollama_client.chat(
                model=self.ollama_model,
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
            )
            return res.get("message", {}).get("content", "").strip()
        except Exception:
            return None

    async def _call_openai(self, prompt: str) -> Optional[str]:
        """Call OpenAI chat completion API."""
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.1,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
            return None

    def _synthesize_coherent_fallback(
        self, query: str, passages: List[RetrievedPassage]
    ) -> Tuple[str, bool]:
        """
        Synthesizes clean, fluent, human-readable paragraphs from the top passages
        when an external LLM is offline, filtering out markdown noise and headers.
        """
        query_words = set(re.findall(r"\w{3,}", query.lower()))
        stop_words = {
            "what", "when", "where", "which", "does", "have", "should", "could",
            "about", "this", "that", "from", "tell", "show", "policy", "rules"
        }
        keywords = query_words - stop_words
        if not keywords:
            keywords = query_words

        # Clean passages: extract substantive body text
        primary_passage = passages[0]
        cleaned_body_lines = []
        for line in primary_passage.content.splitlines():
            l = line.strip()
            if not l:
                continue
            # Filter out markdown headings, raw page markers, and example questions
            if l.startswith("#") or re.match(r"(?i)^(##\s+Page|\d+\.\s+\d+|Question:|Example)", l):
                continue
            cleaned_body_lines.append(l)

        if not cleaned_body_lines:
            # Fallback across all passages
            for p in passages[1:]:
                for line in p.content.splitlines():
                    l = line.strip()
                    if l and not l.startswith("#") and not re.match(r"(?i)^(##\s+Page|\d+\.\s+\d+|Question:)", l):
                        cleaned_body_lines.append(l)
                        if len(cleaned_body_lines) >= 6:
                            break

        if not cleaned_body_lines:
            return (
                f"{INSUFFICIENT_EVIDENCE_PHRASE} Please verify with your department coordinator or academic office.",
                False,
            )

        # Build clean, fluent response
        doc_ref = f"{primary_passage.document_title} (Page {primary_passage.page_number})"
        intro = f"According to the official **{doc_ref}**:\n"

        # Separate into prose and bulleted points
        prose_parts = []
        bullet_parts = []

        for line in cleaned_body_lines[:8]:
            if line.startswith("-") or line.startswith("•"):
                bullet_parts.append(line)
            else:
                prose_parts.append(line)

        formatted_paragraphs = []
        if prose_parts:
            # Combine up to 3 prose sentences into an introductory paragraph
            body_text = " ".join(prose_parts[:3])
            formatted_paragraphs.append(body_text)

        if bullet_parts:
            formatted_paragraphs.append("\nKey provisions include:\n" + "\n".join(bullet_parts[:5]))
        elif len(prose_parts) > 3:
            secondary_text = " ".join(prose_parts[3:6])
            formatted_paragraphs.append("\n" + secondary_text)

        full_answer = intro + "\n\n".join(formatted_paragraphs)
        return full_answer, True


# Global generator instance
grounded_generator = GroundedAnswerGenerator()
