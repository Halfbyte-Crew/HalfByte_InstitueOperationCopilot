import logging
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.rag.embeddings import EmbeddingService, embedding_service
from app.modules.rag.vector_store import ScoredChunk, VectorStore, vector_store

logger = logging.getLogger(__name__)

STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "if", "because", "as", "what",
    "which", "this", "that", "these", "those", "then", "just", "so", "than",
    "such", "both", "through", "about", "for", "is", "of", "while", "during",
    "to", "from", "in", "out", "on", "off", "again", "further", "then", "once",
    "here", "there", "when", "where", "why", "how", "all", "any", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
    "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will",
    "just", "don", "should", "now", "are", "do", "does", "did", "have", "has", "had"
}

STEM_MAP = {
    "syllabi": "syllab",
    "syllabus": "syllab",
    "syllabuses": "syllab",
    "outcomes": "outcom",
    "outcome": "outcom",
    "structured": "structur",
    "structure": "structur",
    "structures": "structur",
    "structuring": "structur",
    "courses": "cours",
    "course": "cours",
    "policies": "polici",
    "policy": "polici",
    "regulations": "regul",
    "regulation": "regul",
    "examinations": "examin",
    "examination": "examin",
    "attendances": "attend",
    "attendance": "attend",
}


def _get_stem(word: str) -> str:
    w = word.lower()
    if w in STEM_MAP:
        return STEM_MAP[w]
    if w.endswith("ies") and len(w) > 4:
        return w[:-3] + "i"
    if w.endswith("ing") and len(w) > 5:
        return w[:-3]
    if w.endswith("ed") and len(w) > 4:
        return w[:-2]
    if w.endswith("es") and len(w) > 4:
        return w[:-2]
    if w.endswith("s") and len(w) > 3:
        return w[:-1]
    return w


def compute_lexical_match(query: str, content: str, title: str = "") -> float:
    """Computes keyword and stem overlap score between query and document chunk."""
    q_words = [w.lower() for w in re.findall(r"\b\w+\b", query)]
    content_words = [w for w in q_words if w not in STOP_WORDS]
    if not content_words:
        content_words = q_words

    stems = {_get_stem(w) for w in content_words}
    full_text = f"{title} {content}".lower()

    # Check stem matches
    matched_stems = sum(1 for s in stems if s in full_text)
    coverage = matched_stems / max(1, len(stems))

    # Exact phrase matches
    phrase_bonus = 0.0
    for i in range(len(content_words) - 1):
        bigram = f"{content_words[i]} {content_words[i+1]}"
        if bigram in full_text:
            phrase_bonus += 0.2

    # Title match bonus
    title_bonus = 0.0
    title_lower = title.lower()
    for s in stems:
        if s in title_lower:
            title_bonus += 0.15

    score = (coverage * 0.7) + min(0.3, phrase_bonus + title_bonus)
    return round(score, 4)


class RetrievedPassage(BaseModel):
    """Clean passage model returned to the generation and citation pipeline."""
    document_id: str
    document_title: str
    document_category: str
    page_number: int = Field(..., description="1-indexed physical page in the official document")
    chunk_index: int
    content: str
    similarity_score: float
    chunk_metadata: Dict[str, Any] = Field(default_factory=dict)


class KnowledgeRetriever:
    """
    Coordinates hybrid semantic and lexical retrieval:
    1. Embeds the user's natural language question.
    2. Performs access-controlled vector similarity candidate search.
    3. Reranks candidates using lexical match and keyword stem coverage.
    4. Returns top-K relevant passages with exact document and page references.
    """

    def __init__(
        self,
        embedder: Optional[EmbeddingService] = None,
        store: Optional[VectorStore] = None,
    ):
        self.embedder = embedder or embedding_service
        self.store = store or vector_store

    async def retrieve(
        self,
        session: AsyncSession,
        query: str,
        user_role: Optional[str] = None,
        top_k: Optional[int] = None,
        threshold: Optional[float] = None,
        category: Optional[str] = None,
    ) -> List[RetrievedPassage]:
        """
        Retrieve relevant document passages for a query using hybrid re-ranking.
        """
        clean_query = query.strip()
        if not clean_query:
            return []

        limit = top_k if top_k is not None else settings.RAG_TOP_K
        min_score = threshold if threshold is not None else settings.RAG_SIMILARITY_THRESHOLD

        # 1. Generate query embedding
        query_vector = self.embedder.embed_text(clean_query)

        # 2. Retrieve a broader candidate pool for hybrid re-ranking
        candidate_k = max(limit * 3, 10)
        scored_chunks: List[ScoredChunk] = await self.store.search(
            session=session,
            query_vector=query_vector,
            user_role=user_role,
            top_k=candidate_k,
            threshold=max(0.15, min_score * 0.5),
            category=category,
        )

        if not scored_chunks:
            return []

        # 3. Hybrid re-ranking: combine vector similarity and lexical keyword overlap
        reranked = []
        for c in scored_chunks:
            lexical_score = compute_lexical_match(clean_query, c.content, c.document_title)
            # If no keyword matches at all, penalize vector score
            if lexical_score == 0.0:
                hybrid_score = c.similarity_score * 0.5
            else:
                hybrid_score = (c.similarity_score * 0.45) + (lexical_score * 0.55)

            reranked.append((hybrid_score, c))

        # Sort descending by hybrid score
        reranked.sort(key=lambda item: item[0], reverse=True)

        passages = [
            RetrievedPassage(
                document_id=str(c.document_id),
                document_title=c.document_title,
                document_category=c.document_category,
                page_number=c.page_number,
                chunk_index=c.chunk_index,
                content=c.content,
                similarity_score=round(h_score, 4),
                chunk_metadata=c.chunk_metadata,
            )
            for h_score, c in reranked[:limit]
            if h_score >= min_score or h_score >= 0.25
        ]

        logger.info(
            f"RAG Retrieval: query='{clean_query[:50]}...', role={user_role}, "
            f"retrieved={len(passages)} chunks (top_score={passages[0].similarity_score if passages else 0.0})"
        )

        return passages


# Global retriever instance
knowledge_retriever = KnowledgeRetriever()
