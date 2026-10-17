import logging
import uuid
from typing import Any, Dict, List, Optional
import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.rag import DocumentChunk, KnowledgeDocument
from app.modules.rag.schemas import ChunkPayload

logger = logging.getLogger(__name__)


class ScoredChunk:
    """Represents a retrieved chunk with its associated document context and score."""

    def __init__(
        self,
        chunk_id: uuid.UUID,
        document_id: uuid.UUID,
        document_title: str,
        document_category: str,
        page_number: int,
        chunk_index: int,
        content: str,
        similarity_score: float,
        chunk_metadata: Optional[Dict[str, Any]] = None,
    ):
        self.chunk_id = chunk_id
        self.document_id = document_id
        self.document_title = document_title
        self.document_category = document_category
        self.page_number = page_number
        self.chunk_index = chunk_index
        self.content = content
        self.similarity_score = similarity_score
        self.chunk_metadata = chunk_metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": str(self.chunk_id),
            "document_id": str(self.document_id),
            "document_title": self.document_title,
            "document_category": self.document_category,
            "page_number": self.page_number,
            "chunk_index": self.chunk_index,
            "content": self.content,
            "similarity_score": round(self.similarity_score, 4),
            "chunk_metadata": self.chunk_metadata,
        }


class VectorStore:
    """
    Database-backed vector store that persists chunks and performs
    cosine similarity search with role-based document access filtering.
    """

    @staticmethod
    async def store_chunks(
        session: AsyncSession,
        document_id: uuid.UUID,
        chunks: List[ChunkPayload],
        embeddings: List[List[float]],
    ) -> List[DocumentChunk]:
        """Persist document chunks with their vector embeddings."""
        if len(chunks) != len(embeddings):
            raise ValueError("Chunks count and embeddings count must match.")

        db_chunks = []
        for chunk_payload, emb in zip(chunks, embeddings):
            db_chunk = DocumentChunk(
                document_id=document_id,
                chunk_index=chunk_payload.chunk_index,
                page_number=chunk_payload.page_number,
                content=chunk_payload.content,
                token_count=chunk_payload.token_count,
                embedding=emb,
                chunk_metadata=chunk_payload.chunk_metadata,
            )
            db_chunks.append(db_chunk)
            session.add(db_chunk)

        await session.commit()
        return db_chunks

    @staticmethod
    async def search(
        session: AsyncSession,
        query_vector: List[float],
        user_role: Optional[str] = None,
        top_k: int = 4,
        threshold: float = 0.40,
        category: Optional[str] = None,
    ) -> List[ScoredChunk]:
        """
        Search for top-K most similar chunks respecting user role and threshold.
        """
        if not query_vector:
            return []

        # Load active documents joined with chunks
        stmt = (
            select(DocumentChunk)
            .join(KnowledgeDocument, DocumentChunk.document_id == KnowledgeDocument.id)
            .where(KnowledgeDocument.is_active == True)
            .options(selectinload(DocumentChunk.document))
        )

        if category:
            stmt = stmt.where(KnowledgeDocument.category == category)

        result = await session.execute(stmt)
        candidate_chunks = result.scalars().all()

        if not candidate_chunks:
            return []

        q_vec = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []

        scored_candidates: List[ScoredChunk] = []

        for chunk in candidate_chunks:
            doc = chunk.document
            if not doc:
                continue

            # Role-based access control filtering
            if user_role and user_role not in ["super_admin", "owner"]:
                allowed = doc.allowed_roles or []
                if allowed and (user_role not in allowed):
                    # User not permitted to view this document
                    continue

            # If embedding is missing, skip
            if not chunk.embedding:
                continue

            c_vec = np.array(chunk.embedding, dtype=np.float32)
            c_norm = np.linalg.norm(c_vec)
            if c_norm == 0:
                continue

            # Cosine similarity
            similarity = float(np.dot(q_vec, c_vec) / (q_norm * c_norm))

            if similarity >= threshold:
                scored_candidates.append(
                    ScoredChunk(
                        chunk_id=chunk.id,
                        document_id=doc.id,
                        document_title=doc.title,
                        document_category=doc.category,
                        page_number=chunk.page_number,
                        chunk_index=chunk.chunk_index,
                        content=chunk.content,
                        similarity_score=similarity,
                        chunk_metadata=chunk.chunk_metadata,
                    )
                )

        # Sort descending by similarity
        scored_candidates.sort(key=lambda x: x.similarity_score, reverse=True)
        return scored_candidates[:top_k]


vector_store = VectorStore()
