import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rag import KnowledgeDocument
from app.modules.rag.embeddings import EmbeddingService
from app.modules.rag.service import rag_service
from app.modules.rag.vector_store import VectorStore
from app.modules.rag.schemas import ChunkPayload


@pytest.fixture(autouse=True)
def configure_test_services(monkeypatch):
    """Ensure tests run with fast offline fallback embeddings."""
    fast_embedder = EmbeddingService(fallback_dim=64, force_fallback=True)
    monkeypatch.setattr(rag_service, "embedder", fast_embedder)
    monkeypatch.setattr(rag_service.retriever, "embedder", fast_embedder)


@pytest.mark.asyncio
async def test_rag_endpoints_lifecycle(client: AsyncClient, db_session: AsyncSession):
    """Test full RAG API lifecycle: document listing, indexing, query with citations, and abstention."""
    # 1. Ingest a test document into test DB
    doc = KnowledgeDocument(
        title="Student Attendance and Leave Policy 2026",
        filename="attendance_leave_2026.md",
        file_hash="hash_attendance_test_999",
        category="student_policies",
        version="1.0",
        is_active=True,
        allowed_roles=["student", "trainer", "counselor", "owner", "super_admin"],
        total_pages=2,
        total_chunks=2,
    )
    db_session.add(doc)
    await db_session.commit()
    await db_session.refresh(doc)

    chunks = [
        ChunkPayload(
            chunk_index=0,
            page_number=1,
            content="Page 1: All registered students must maintain a minimum attendance of 75 percent in lectures.",
            token_count=16,
            chunk_metadata={"section": "Attendance Requirements"},
        ),
        ChunkPayload(
            chunk_index=1,
            page_number=2,
            content="Page 2: Medical leave applications must be submitted within 3 business days of absence with a doctor's certificate.",
            token_count=18,
            chunk_metadata={"section": "Medical Leave"},
        ),
    ]
    vectors = rag_service.embedder.embed_batch([c.content for c in chunks])
    await VectorStore.store_chunks(db_session, doc.id, chunks, vectors)

    # 2. List documents via API
    list_res = await client.get("/api/v1/copilot/rag/documents")
    assert list_res.status_code == 200
    docs = list_res.json()
    assert len(docs) >= 1
    assert any(d["title"] == "Student Attendance and Leave Policy 2026" for d in docs)

    # 3. Query RAG with relevant question
    query_payload = {
        "question": "What is the minimum attendance requirement for lectures?",
        "top_k": 2,
    }
    query_res = await client.post("/api/v1/copilot/rag/query", json=query_payload)
    assert query_res.status_code == 200
    data = query_res.json()

    assert data["evidence_sufficient"] is True
    assert len(data["citations"]) >= 1
    # Verify citation has title and page 1
    citation = data["citations"][0]
    assert citation["document_title"] == "Student Attendance and Leave Policy 2026"
    assert citation["page_number"] == 1
    assert "75 percent" in data["answer"].lower() or "attendance" in data["answer"].lower()

    # 4. Query RAG with medical leave question (Page 2 citation)
    med_payload = {
        "question": "How many days do I have to submit a medical leave certificate?",
        "top_k": 2,
    }
    med_res = await client.post("/api/v1/copilot/rag/query", json=med_payload)
    assert med_res.status_code == 200
    med_data = med_res.json()
    assert med_data["evidence_sufficient"] is True
    assert any(c["page_number"] == 2 for c in med_data["citations"])

    # 5. Query with irrelevant / insufficient evidence question
    irrelevant_payload = {
        "question": "What is the warp drive fuel recipe for starships in galaxies?",
        "top_k": 2,
    }
    irr_res = await client.post("/api/v1/copilot/rag/query", json=irrelevant_payload)
    assert irr_res.status_code == 200
    irr_data = irr_res.json()
    assert irr_data["evidence_sufficient"] is False
    assert "sufficient information" in irr_data["answer"].lower()
