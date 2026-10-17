import uuid
from datetime import date
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class KnowledgeDocument(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Metadata and tracking record for an official institute document
    ingested into the RAG knowledge base.
    """
    __tablename__ = "knowledge_documents"

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  # SHA-256
    category: Mapped[str] = mapped_column(
        String(100),
        default="general",
        nullable=False,
        index=True
    )  # e.g., "handbook", "policy", "syllabus", "fees", "exam"
    version: Mapped[str] = mapped_column(String(50), default="1.0", nullable=False)
    effective_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    
    # Allowed role tags for access-controlled retrieval (e.g. ["student", "trainer", "owner"])
    allowed_roles: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    
    total_pages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_chunks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationship to constituent searchable chunks
    chunks: Mapped[List["DocumentChunk"]] = relationship(
        "DocumentChunk",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentChunk.chunk_index",
    )


class DocumentChunk(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Searchable, page-aware text passage chunk generated from a KnowledgeDocument.
    """
    __tablename__ = "document_chunks"

    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("knowledge_documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # 1-indexed
    content: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Vector embedding stored as a list of floats (JSON format for universal DB compatibility)
    embedding: Mapped[Optional[List[float]]] = mapped_column(JSON, nullable=True)
    
    # Chunk-specific metadata (e.g., section title, heading, tags)
    chunk_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Relationship
    document: Mapped["KnowledgeDocument"] = relationship(
        "KnowledgeDocument",
        back_populates="chunks",
    )
