import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.rag.embeddings import EmbeddingService, embedding_service
from app.modules.rag.vector_store import ScoredChunk, VectorStore, vector_store

logger = logging.getLogger(__name__)


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
    Coordinates semantic retrieval:
    1. Embeds the user's natural language question.
    2. Performs access-controlled vector similarity search in the knowledge base.
    3. Returns top-K relevant passages with exact document and page references.
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
        Retrieve relevant document passages for a query.
        """
        clean_query = query.strip()
        if not clean_query:
            return []

        limit = top_k if top_k is not None else settings.RAG_TOP_K
        min_score = threshold if threshold is not None else settings.RAG_SIMILARITY_THRESHOLD

        # 1. Generate query embedding
        query_vector = self.embedder.embed_text(clean_query)

        # 2. Perform search with role-based document access filtering
        scored_chunks: List[ScoredChunk] = await self.store.search(
            session=session,
            query_vector=query_vector,
            user_role=user_role,
            top_k=limit,
            threshold=min_score,
            category=category,
        )

        passages = [
            RetrievedPassage(
                document_id=str(c.document_id),
                document_title=c.document_title,
                document_category=c.document_category,
                page_number=c.page_number,
                chunk_index=c.chunk_index,
                content=c.content,
                similarity_score=round(c.similarity_score, 4),
                chunk_metadata=c.chunk_metadata,
            )
            for c in scored_chunks
        ]

        logger.info(
            f"RAG Retrieval: query='{clean_query[:50]}...', role={user_role}, "
            f"retrieved={len(passages)} chunks (top_score={passages[0].similarity_score if passages else 0.0})"
        )

        return passages


# Global retriever instance
knowledge_retriever = KnowledgeRetriever()
