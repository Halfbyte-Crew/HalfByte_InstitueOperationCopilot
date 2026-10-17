from datetime import date
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rag import KnowledgeDocument
from app.modules.rag.chunker import DocumentChunker
from app.modules.rag.embeddings import EmbeddingError, EmbeddingService
from app.modules.rag.extractor import PDFExtractor
from app.modules.rag.retriever import KnowledgeRetriever
from app.modules.rag.schemas import ChunkPayload
from app.modules.rag.vector_store import VectorStore
from tests.unit.test_rag_extraction_and_chunking import create_sample_institute_pdf


def test_embedding_service_deterministic():
    """Verify embedding service produces normalized vectors and respects consistency."""
    service = EmbeddingService(fallback_dim=64, force_fallback=True)

    # Valid string
    vec = service.embed_text("Attendance rules and semester criteria")
    assert isinstance(vec, list)
    assert len(vec) == 64
    assert any(v != 0 for v in vec)

    # Identical string must produce identical vector
    vec2 = service.embed_text("Attendance rules and semester criteria")
    assert vec == vec2

    # Batch embedding
    batch_vecs = service.embed_batch(["First doc", "Second doc"])
    assert len(batch_vecs) == 2
    assert len(batch_vecs[0]) == 64
    assert len(batch_vecs[1]) == 64

    # Empty text raises EmbeddingError
    with pytest.raises(EmbeddingError):
        service.embed_text("   ")


@pytest.mark.asyncio
async def test_vector_store_and_role_based_retrieval(db_session: AsyncSession):
    """
    Verify end-to-end vector indexing and role-based access filtering.
    Restricted faculty payroll policies must not be accessible to students.
    """
    service = EmbeddingService(fallback_dim=64, force_fallback=True)
    store = VectorStore()
    retriever = KnowledgeRetriever(embedder=service, store=store)

    # 1. Ingest Public Student Handbook (Allowed: student, trainer, owner)
    doc_student = KnowledgeDocument(
        title="Student Academic Handbook 2026",
        filename="student_handbook_2026.pdf",
        file_hash="hash_student_handbook_123",
        category="handbook",
        version="1.0",
        effective_date=date(2026, 8, 1),
        is_active=True,
        allowed_roles=["student", "trainer", "owner"],
        total_pages=2,
        total_chunks=2,
    )
    db_session.add(doc_student)
    await db_session.commit()
    await db_session.refresh(doc_student)

    chunks_student = [
        ChunkPayload(
            chunk_index=0,
            page_number=1,
            content="All registered students must maintain a minimum of 75% attendance in each course.",
            token_count=13,
            chunk_metadata={"section": "Attendance"},
        ),
        ChunkPayload(
            chunk_index=1,
            page_number=2,
            content="Grading regulations: continuous assessment is 40% and final examination is 60%.",
            token_count=12,
            chunk_metadata={"section": "Grading"},
        ),
    ]
    emb_student = service.embed_batch([c.content for c in chunks_student])
    await store.store_chunks(db_session, doc_student.id, chunks_student, emb_student)

    # 2. Ingest Confidential Financial Policy (Allowed ONLY: owner, accounts)
    doc_finance = KnowledgeDocument(
        title="Faculty Remuneration & Payroll Guidelines",
        filename="payroll_2026.pdf",
        file_hash="hash_finance_payroll_456",
        category="finance",
        version="1.0",
        effective_date=date(2026, 1, 1),
        is_active=True,
        allowed_roles=["owner", "accounts"],
        total_pages=1,
        total_chunks=1,
    )
    db_session.add(doc_finance)
    await db_session.commit()
    await db_session.refresh(doc_finance)

    chunks_finance = [
        ChunkPayload(
            chunk_index=0,
            page_number=1,
            content="Faculty payroll and monthly salary disbursement occurs on the final business day of every month.",
            token_count=16,
            chunk_metadata={"section": "Payroll Schedule"},
        )
    ]
    emb_finance = service.embed_batch([c.content for c in chunks_finance])
    await store.store_chunks(db_session, doc_finance.id, chunks_finance, emb_finance)

    # 3. Test Retrieval as Student: Ask about attendance
    res_student = await retriever.retrieve(
        session=db_session,
        query="What is the required minimum attendance for students?",
        user_role="student",
        top_k=2,
        threshold=0.20,
    )
    assert len(res_student) >= 1
    top_hit = res_student[0]
    assert top_hit.document_title == "Student Academic Handbook 2026"
    assert top_hit.page_number == 1
    assert "75% attendance" in top_hit.content

    # 4. Security Test: Student asks about faculty payroll -> MUST NOT receive financial document!
    res_security = await retriever.retrieve(
        session=db_session,
        query="When is faculty payroll and salary disbursement processed?",
        user_role="student",
        top_k=2,
        threshold=0.20,
    )
    # The student role is not in doc_finance.allowed_roles (["owner", "accounts"])
    assert not any(p.document_title == "Faculty Remuneration & Payroll Guidelines" for p in res_security)

    # 5. Access Check: Accounts role asks about faculty payroll -> MUST receive financial document!
    res_accounts = await retriever.retrieve(
        session=db_session,
        query="When is faculty payroll and salary disbursement processed?",
        user_role="accounts",
        top_k=2,
        threshold=0.20,
    )
    assert len(res_accounts) >= 1
    assert res_accounts[0].document_title == "Faculty Remuneration & Payroll Guidelines"
    assert res_accounts[0].page_number == 1
    assert "monthly salary" in res_accounts[0].content
