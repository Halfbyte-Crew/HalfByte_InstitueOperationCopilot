import logging
import os
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rag import DocumentChunk, KnowledgeDocument
from app.modules.rag.chunker import DocumentChunker
from app.modules.rag.embeddings import EmbeddingService, embedding_service
from app.modules.rag.extractor import DocumentExtractor
from app.modules.rag.generator import GroundedAnswerGenerator, grounded_generator
from app.modules.rag.retriever import KnowledgeRetriever, knowledge_retriever
from app.modules.rag.vector_store import VectorStore, vector_store

logger = logging.getLogger(__name__)

# Default category and role mapping based on knowledge_base directory names
DIRECTORY_ROLE_MAP: Dict[str, Dict[str, Any]] = {
    "student_policies": {
        "category": "student_policies",
        "allowed_roles": ["student", "trainer", "counselor", "owner", "super_admin"],
    },
    "academic_regulations": {
        "category": "academic_regulations",
        "allowed_roles": ["student", "trainer", "counselor", "owner", "super_admin"],
    },
    "syllabi": {
        "category": "syllabi",
        "allowed_roles": ["student", "trainer", "counselor", "owner", "super_admin"],
    },
    "academic_calendar": {
        "category": "academic_calendar",
        "allowed_roles": ["student", "trainer", "counselor", "accounts", "owner", "super_admin"],
    },
    "examinations": {
        "category": "examinations",
        "allowed_roles": ["student", "trainer", "counselor", "owner", "super_admin"],
    },
    "admissions_and_fees": {
        "category": "admissions_and_fees",
        "allowed_roles": ["student", "accounts", "counselor", "owner", "super_admin"],
    },
    "faculty_guidelines": {
        "category": "faculty_guidelines",
        "allowed_roles": ["trainer", "owner", "super_admin"],  # Student restricted!
    },
    "administrative_procedures": {
        "category": "administrative_procedures",
        "allowed_roles": ["student", "counselor", "accounts", "owner", "super_admin"],
    },
    "campus_safety": {
        "category": "campus_safety",
        "allowed_roles": ["student", "trainer", "counselor", "accounts", "owner", "super_admin"],
    },
    "notices": {
        "category": "notices",
        "allowed_roles": ["student", "trainer", "counselor", "accounts", "owner", "super_admin"],
    },
}


class RAGService:
    """
    High-level orchestrator connecting extraction, chunking, embedding,
    storage, retrieval, and grounded answer synthesis.
    """

    def __init__(
        self,
        embedder: Optional[EmbeddingService] = None,
        store: Optional[VectorStore] = None,
        retriever: Optional[KnowledgeRetriever] = None,
        generator: Optional[GroundedAnswerGenerator] = None,
    ):
        self.embedder = embedder or embedding_service
        self.store = store or vector_store
        self.retriever = retriever or knowledge_retriever
        self.generator = generator or grounded_generator
        self.chunker = DocumentChunker(chunk_size=700, chunk_overlap=120)

    async def ingest_document(
        self,
        session: AsyncSession,
        filepath: str,
        category: str = "general",
        allowed_roles: Optional[List[str]] = None,
        override_title: Optional[str] = None,
    ) -> KnowledgeDocument:
        """
        Ingest a single PDF or Markdown file:
        1. Extract text and pages with DocumentExtractor.
        2. Check for duplicate SHA-256 hash.
        3. Chunk into page-preserved passages.
        4. Generate embeddings via EmbeddingService.
        5. Persist to PostgreSQL / VectorStore.
        """
        roles = allowed_roles or ["student", "trainer", "counselor", "accounts", "owner", "super_admin"]

        # Extract
        extracted_doc = DocumentExtractor.extract_from_file(filepath, override_title=override_title)

        # Check existing document by hash to prevent duplicate clutter
        stmt = select(KnowledgeDocument).where(KnowledgeDocument.file_hash == extracted_doc.file_hash)
        res = await session.execute(stmt)
        existing = res.scalar_one_or_none()
        if existing:
            logger.info(f"Document '{extracted_doc.title}' ({extracted_doc.filename}) already indexed. Skipping.")
            return existing

        # Chunk
        chunks = self.chunker.chunk_document(extracted_doc)
        if not chunks:
            raise ValueError(f"No extractable text chunks found in '{filepath}'.")

        # Embed
        texts = [c.content for c in chunks]
        embeddings = self.embedder.embed_batch(texts)

        # Create Document record
        doc = KnowledgeDocument(
            title=extracted_doc.title,
            filename=extracted_doc.filename,
            file_hash=extracted_doc.file_hash,
            category=category,
            version="1.0",
            is_active=True,
            allowed_roles=roles,
            total_pages=extracted_doc.total_pages,
            total_chunks=len(chunks),
        )
        session.add(doc)
        await session.commit()
        await session.refresh(doc)

        # Store chunks in VectorStore
        await self.store.store_chunks(session, doc.id, chunks, embeddings)
        logger.info(f"Successfully ingested '{doc.title}': {doc.total_pages} pages, {len(chunks)} chunks.")
        return doc

    async def query(
        self,
        session: AsyncSession,
        question: str,
        user_role: Optional[str] = None,
        top_k: int = 4,
    ) -> Dict[str, Any]:
        """
        Execute full RAG workflow:
        1. Access-controlled Top-K retrieval.
        2. Grounded answer generation.
        3. Structured citations.
        """
        passages = await self.retriever.retrieve(
            session=session,
            query=question,
            user_role=user_role,
            top_k=top_k,
        )

        gen_result = await self.generator.generate(
            query=question,
            passages=passages,
            user_role=user_role,
        )

        return {
            "question": question,
            "answer": gen_result.answer,
            "citations": [c.model_dump() for c in gen_result.citations],
            "evidence_sufficient": gen_result.evidence_sufficient,
            "model_used": gen_result.model_used,
            "retrieved_passages": [p.model_dump() for p in passages],
        }

    async def ingest_knowledge_base_directory(
        self,
        session: AsyncSession,
        base_dir: str,
    ) -> Dict[str, Any]:
        """
        Scans all folders in `knowledge_base/` and indexes all .md and .pdf files.
        """
        indexed_docs = []
        errors = []

        if not os.path.exists(base_dir):
            raise FileNotFoundError(f"Directory '{base_dir}' does not exist.")

        for folder_name, config in DIRECTORY_ROLE_MAP.items():
            folder_path = os.path.join(base_dir, folder_name)
            if not os.path.exists(folder_path):
                continue

            for root, _, files in os.walk(folder_path):
                for f in sorted(files):
                    if f.startswith(".") or f.lower().endswith(".gitkeep"):
                        continue
                    ext = os.path.splitext(f)[1].lower()
                    if ext in [".pdf", ".md", ".txt"]:
                        full_path = os.path.join(root, f)
                        try:
                            doc = await self.ingest_document(
                                session=session,
                                filepath=full_path,
                                category=config["category"],
                                allowed_roles=config["allowed_roles"],
                            )
                            indexed_docs.append({
                                "filename": f,
                                "title": doc.title,
                                "category": doc.category,
                                "pages": doc.total_pages,
                                "chunks": doc.total_chunks,
                            })
                        except Exception as exc:
                            logger.error(f"Failed to ingest {full_path}: {exc}")
                            errors.append({"file": f, "error": str(exc)})

        return {
            "total_ingested": len(indexed_docs),
            "documents": indexed_docs,
            "errors": errors,
        }


# Global service instance
rag_service = RAGService()
