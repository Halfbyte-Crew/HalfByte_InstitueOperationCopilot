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
        fallback_ans, is_sufficient, used_citations = self._synthesize_coherent_fallback(query, passages)
        return GeneratedAnswer(
            answer=fallback_ans,
            citations=used_citations if is_sufficient else [],
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

    def _create_informative_excerpt(self, content: str) -> str:
        """Extract a meaningful excerpt or section summary rather than an incomplete line fragment."""
        lines = [l.strip() for l in content.splitlines() if l.strip()]
        header = None
        meaningful_lines = []
        for line in lines:
            if line.startswith("#"):
                clean_h = line.lstrip("#").strip()
                if not header and not clean_h.lower().startswith("page"):
                    header = clean_h
            else:
                meaningful_lines.append(line)

        if not meaningful_lines:
            return content[:160]

        # Combine first 2-3 lines for a coherent excerpt
        body = " ".join(meaningful_lines[:2])
        if header and not body.lower().startswith(header.lower()):
            excerpt = f"{header}: {body}"
        else:
            excerpt = body

        if len(excerpt) > 200:
            excerpt = excerpt[:197] + "..."
        return excerpt

    def _synthesize_coherent_fallback(
        self, query: str, passages: List[RetrievedPassage]
    ) -> Tuple[str, bool, List[Citation]]:
        """
        Synthesizes clean, fluent, structured paragraphs from the top passages
        when an external LLM is offline, filtering out markdown noise and headers.
        Returns (answer_text, evidence_sufficient, used_citations).
        """
        from app.modules.rag.retriever import compute_lexical_match

        # 1. Filter passages with actual keyword relevance
        relevant = []
        for p in passages:
            match_score = compute_lexical_match(query, p.content, p.document_title)
            if match_score > 0.08 or (not relevant and match_score > 0.0):
                relevant.append((match_score, p))

        if not relevant:
            return (
                f"{INSUFFICIENT_EVIDENCE_PHRASE} Please verify with your department coordinator or academic office.",
                False,
                [],
            )

        # Sort by relevance
        relevant.sort(key=lambda x: x[0], reverse=True)
        top_relevance = relevant[0][0]

        # Group by (doc_title, page_number), retaining only top-tier relevant pages
        pages_seen = set()
        unique_page_passages = []
        for score, p in relevant:
            if score < (top_relevance * 0.75) and len(unique_page_passages) >= 2:
                continue
            key = (p.document_title, p.page_number)
            if key not in pages_seen:
                pages_seen.add(key)
                unique_page_passages.append(p)
            if len(unique_page_passages) >= 3:
                break

        # 2. Extract structured content per page
        page_sections = []
        used_citations = []

        for p in unique_page_passages:
            section_title = None
            bullets = []
            prose = []

            for line in p.content.splitlines():
                l = line.strip()
                if not l:
                    continue
                if l.startswith("## ") and "page" in l.lower():
                    # e.g. ## Page 2 — Structure of a Syllabus Document
                    parts = l.split("—", 1)
                    if len(parts) > 1 and not section_title:
                        section_title = parts[1].strip()
                    continue
                if l.startswith("### "):
                    # e.g. ### 2.1 Standard sections or ### 6.2 Course outcomes
                    clean_h = re.sub(r"^\d+[\.\d]*\s*", "", l[4:].strip())
                    if not section_title:
                        section_title = clean_h
                    continue
                if l.startswith("#"):
                    continue
                if re.match(r"(?i)^(Question:|Example|Workflow:)", l):
                    continue

                # Collect bullet or numbered items (handles "1. Item", "10.Assessment pattern", etc.)
                if re.match(r"^(?:[-*•]|\d+[\.\)])\s*", l):
                    clean_item = re.sub(r"^(?:[-*•]|\d+[\.\)])\s*", "", l).strip()
                    if clean_item and len(clean_item) > 3:
                        bullets.append(clean_item)
                else:
                    prose.append(l)

            if not bullets and not prose:
                continue

            sec_name = section_title or p.document_title
            used_citations.append(
                Citation(
                    document_title=p.document_title,
                    page_number=p.page_number,
                    excerpt=self._create_informative_excerpt(p.content),
                    similarity_score=p.similarity_score,
                )
            )

            page_sections.append({
                "doc_title": p.document_title,
                "page_number": p.page_number,
                "title": sec_name,
                "prose": prose,
                "bullets": bullets,
            })

        if not page_sections:
            return (
                f"{INSUFFICIENT_EVIDENCE_PHRASE} Please verify with your department coordinator or academic office.",
                False,
                [],
            )

        # 3. Format into a professional multi-topic or single-topic response
        if len(page_sections) == 1:
            sec = page_sections[0]
            intro = f"According to official institute documentation (**{sec['doc_title']}**, Page {sec['page_number']}):\n\n"
            body_parts = []
            if sec["prose"]:
                body_parts.append(" ".join(sec["prose"][:3]))
            if sec["bullets"]:
                body_parts.append("Key points include:\n" + "\n".join(f"- {b}" for b in sec["bullets"][:8]))
            full_text = intro + "\n\n".join(body_parts)
            return full_text, True, used_citations

        # Multiple relevant pages: Build structured multi-part response
        main_doc = page_sections[0]["doc_title"]
        header = f"According to official institute documentation (**{main_doc}**):\n\n"
        section_texts = []
        for idx, sec in enumerate(page_sections, start=1):
            sec_header = f"### {idx}. {sec['title']} (Page {sec['page_number']})"
            sec_body = []
            if sec["prose"]:
                sec_body.append(" ".join(sec["prose"][:2]))
            if sec["bullets"]:
                sec_body.append("\n".join(f"- {b}" for b in sec["bullets"][:8]))
            elif len(sec["prose"]) > 2:
                sec_body.append(" ".join(sec["prose"][2:5]))

            section_texts.append(f"{sec_header}\n" + "\n\n".join(sec_body))

        full_text = header + "\n\n".join(section_texts)
        return full_text, True, used_citations


# Global generator instance
grounded_generator = GroundedAnswerGenerator()
