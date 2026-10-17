import logging
import os
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.rag import DocumentChunk, KnowledgeDocument
from app.modules.rag.service import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/copilot/rag", tags=["Knowledge Assistant (RAG)"])


# -------------------------------------------------------------
# Schemas
# -------------------------------------------------------------

class RAGQueryRequest(BaseModel):
    question: str = Field(..., min_length=2, description="Natural language question")
    top_k: Optional[int] = Field(default=4, ge=1, le=10, description="Max passages to retrieve")
    category: Optional[str] = Field(default=None, description="Optional category filter")


class CitationResponse(BaseModel):
    document_title: str
    page_number: int
    excerpt: str
    similarity_score: float


class RetrievedPassageResponse(BaseModel):
    document_title: str
    page_number: int
    content: str
    similarity_score: float


class RAGQueryResponse(BaseModel):
    question: str
    answer: str
    citations: List[CitationResponse] = []
    evidence_sufficient: bool
    model_used: str
    retrieved_passages: List[RetrievedPassageResponse] = []


class IngestFolderResponse(BaseModel):
    message: str
    total_ingested: int
    documents: List[Dict[str, Any]]
    errors: List[Dict[str, Any]] = []


class DocumentListItem(BaseModel):
    id: str
    title: str
    filename: str
    category: str
    total_pages: int
    total_chunks: int
    is_active: bool
    allowed_roles: List[str]
    created_at: str


# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@router.post("/query", response_model=RAGQueryResponse)
async def query_knowledge_base(
    payload: RAGQueryRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Query the institutional knowledge base.
    Uses the authenticated user's role to restrict access to authorized documents only.
    """
    user_role = current_user.get("role", "student")
    try:
        result = await rag_service.query(
            session=db,
            question=payload.question,
            user_role=user_role,
            top_k=payload.top_k or 4,
        )
        return result
    except Exception as exc:
        logger.error(f"Error querying RAG knowledge base: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Knowledge retrieval error: {str(exc)}",
        )


@router.post("/ingest-folder", response_model=IngestFolderResponse)
async def ingest_knowledge_base_folder(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin endpoint to scan the knowledge_base/ directories and index all .md and .pdf files.
    """
    role = current_user.get("role")
    if role not in ["super_admin", "owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to run knowledge base ingestion.",
        )

    # Locate knowledge_base directory relative to repo root
    # backend/app/modules/rag/router.py -> 4 levels up to root
    current_file = os.path.abspath(__file__)
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_file)))))
    kb_path = os.path.join(repo_root, "knowledge_base")

    if not os.path.exists(kb_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"knowledge_base directory not found at {kb_path}",
        )

    result = await rag_service.ingest_knowledge_base_directory(session=db, base_dir=kb_path)
    return {
        "message": f"Ingestion completed. {result['total_ingested']} documents indexed.",
        "total_ingested": result["total_ingested"],
        "documents": result["documents"],
        "errors": result["errors"],
    }


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("general"),
    allowed_roles: str = Form("student,trainer,counselor,owner"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload and index a single PDF or Markdown document."""
    role = current_user.get("role")
    if role not in ["super_admin", "owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to upload documents.",
        )

    roles_list = [r.strip() for r in allowed_roles.split(",") if r.strip()]
    content = await file.read()

    # Save to temporary scratch location for extraction
    import tempfile
    ext = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        doc = await rag_service.ingest_document(
            session=db,
            filepath=tmp_path,
            category=category,
            allowed_roles=roles_list,
            override_title=file.filename.rsplit(".", 1)[0].replace("_", " ").title(),
        )
        return {
            "status": "success",
            "document_id": str(doc.id),
            "title": doc.title,
            "filename": doc.filename,
            "pages": doc.total_pages,
            "chunks": doc.total_chunks,
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.get("/documents", response_model=List[DocumentListItem])
async def list_documents(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all currently indexed documents in the knowledge base."""
    stmt = select(KnowledgeDocument).order_by(KnowledgeDocument.created_at.desc())
    res = await db.execute(stmt)
    docs = res.scalars().all()

    return [
        DocumentListItem(
            id=str(d.id),
            title=d.title,
            filename=d.filename,
            category=d.category,
            total_pages=d.total_pages,
            total_chunks=d.total_chunks,
            is_active=d.is_active,
            allowed_roles=d.allowed_roles,
            created_at=d.created_at.isoformat() if d.created_at else "",
        )
        for d in docs
    ]


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and all its constituent chunks."""
    role = current_user.get("role")
    if role not in ["super_admin", "owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to delete documents.",
        )

    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document UUID")

    stmt = select(KnowledgeDocument).where(KnowledgeDocument.id == doc_uuid)
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    await db.delete(doc)
    await db.commit()
    return {"status": "success", "message": f"Document '{doc.title}' deleted successfully."}
