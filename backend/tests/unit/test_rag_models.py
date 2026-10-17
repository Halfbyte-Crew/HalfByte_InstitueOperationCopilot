import uuid
from datetime import date
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rag import KnowledgeDocument, DocumentChunk


@pytest.mark.asyncio
async def test_knowledge_document_and_chunks_lifecycle(db_session: AsyncSession):
    """Verify KnowledgeDocument and DocumentChunk creation, relationship, and cascade."""
    # 1. Create a KnowledgeDocument
    doc = KnowledgeDocument(
        title="Student Academic Regulations 2026",
        filename="academic_regs_2026.pdf",
        file_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        category="handbook",
        version="2.0",
        effective_date=date(2026, 9, 1),
        is_active=True,
        allowed_roles=["student", "trainer", "counselor", "owner"],
        total_pages=15,
        total_chunks=2,
    )
    db_session.add(doc)
    await db_session.commit()
    await db_session.refresh(doc)

    assert doc.id is not None
    assert doc.created_at is not None
    assert doc.allowed_roles == ["student", "trainer", "counselor", "owner"]
    assert doc.version == "2.0"

    # 2. Add DocumentChunks
    chunk1 = DocumentChunk(
        document_id=doc.id,
        chunk_index=0,
        page_number=1,
        content="Section 1. Minimum attendance requirement is 75% for exam eligibility.",
        token_count=12,
        embedding=[0.05, 0.12, -0.08, 0.94],
        chunk_metadata={"section": "Attendance Rules"},
    )
    chunk2 = DocumentChunk(
        document_id=doc.id,
        chunk_index=1,
        page_number=2,
        content="Section 2. Grading scale and continuous assessment criteria.",
        token_count=10,
        embedding=[-0.15, 0.42, 0.08, 0.14],
        chunk_metadata={"section": "Grading Scale"},
    )
    db_session.add_all([chunk1, chunk2])
    await db_session.commit()

    # 3. Query document with relationship chunks
    stmt = select(KnowledgeDocument).where(KnowledgeDocument.id == doc.id)
    result = await db_session.execute(stmt)
    retrieved_doc = result.scalar_one()

    # Query chunks directly
    chunk_stmt = select(DocumentChunk).where(DocumentChunk.document_id == doc.id).order_by(DocumentChunk.chunk_index)
    chunks_res = await db_session.execute(chunk_stmt)
    chunks = chunks_res.scalars().all()

    assert len(chunks) == 2
    assert chunks[0].page_number == 1
    assert chunks[0].content.startswith("Section 1")
    assert chunks[0].embedding == [0.05, 0.12, -0.08, 0.94]
    assert chunks[0].chunk_metadata == {"section": "Attendance Rules"}
    assert chunks[1].page_number == 2

    # 4. Test Cascade Delete: deleting doc must delete chunks
    await db_session.delete(retrieved_doc)
    await db_session.commit()

    remaining_chunks = await db_session.execute(select(DocumentChunk).where(DocumentChunk.document_id == doc.id))
    assert len(remaining_chunks.scalars().all()) == 0
