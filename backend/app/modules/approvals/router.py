"""
Approvals API module — Real database-backed approval workflow.
Only 'super_admin' and 'admin' can approve or reject consequential requests.
"""
from datetime import datetime, timezone
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.institute import ApprovalRequest
from app.schemas.institute import (
    ApprovalActionRequest,
    ApprovalRequestCreate,
    ApprovalRequestResponse,
)

router = APIRouter(
    prefix="/approvals",
    tags=["Approvals"],
)


@router.get(
    "",
    response_model=List[ApprovalRequestResponse],
    dependencies=[Depends(require_roles(["super_admin", "admin", "coordinator"]))],
)
async def list_approvals(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (Pending, Approved, Rejected)"),
    request_type: Optional[str] = Query(None, description="Filter by request type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Lists approval requests from real database records with status and type filters."""
    stmt = select(ApprovalRequest)

    if status_filter and status_filter.lower() != "all":
        stmt = stmt.where(func.lower(ApprovalRequest.status) == status_filter.strip().lower())

    if request_type:
        stmt = stmt.where(func.lower(ApprovalRequest.request_type) == request_type.strip().lower())

    stmt = stmt.order_by(ApprovalRequest.created_at.desc()).offset(skip).limit(limit)
    results = (await db.execute(stmt)).scalars().all()
    return list(results)


@router.get(
    "/counts",
    dependencies=[Depends(require_roles(["super_admin", "admin", "coordinator"]))],
)
async def get_approval_counts(db: AsyncSession = Depends(get_db)):
    """Returns count of pending, approved, and rejected approvals."""
    pending = (
        await db.execute(
            select(func.count(ApprovalRequest.id)).where(ApprovalRequest.status == "Pending")
        )
    ).scalar() or 0

    approved = (
        await db.execute(
            select(func.count(ApprovalRequest.id)).where(ApprovalRequest.status == "Approved")
        )
    ).scalar() or 0

    rejected = (
        await db.execute(
            select(func.count(ApprovalRequest.id)).where(ApprovalRequest.status == "Rejected")
        )
    ).scalar() or 0

    return {
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "total": pending + approved + rejected,
    }


@router.post(
    "",
    response_model=ApprovalRequestResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["super_admin", "admin", "coordinator"]))],
)
async def create_approval_request(
    payload: ApprovalRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Submit a new administrative approval request."""
    approval = ApprovalRequest(
        request_type=payload.request_type,
        title=payload.title,
        description=payload.description,
        requester_name=payload.requester_name,
        requester_email=str(payload.requester_email),
        requester_role=payload.requester_role,
        status="Pending",
        payload=payload.payload,
    )
    db.add(approval)
    await db.commit()
    await db.refresh(approval)
    return approval


@router.get(
    "/{approval_id}",
    response_model=ApprovalRequestResponse,
    dependencies=[Depends(require_roles(["super_admin", "admin", "coordinator"]))],
)
async def get_approval(
    approval_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """View details of a single approval request."""
    approval = await db.get(ApprovalRequest, approval_id)
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval request '{approval_id}' not found.",
        )
    return approval


@router.post(
    "/{approval_id}/approve",
    response_model=ApprovalRequestResponse,
    dependencies=[Depends(require_roles(["super_admin", "admin"]))],
)
async def approve_request(
    approval_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Approve an administrative request.
    Strictly enforced: only 'super_admin' or 'admin' can execute.
    Prevents duplicate decision on non-pending items.
    """
    approval = await db.get(ApprovalRequest, approval_id)
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval request '{approval_id}' not found.",
        )

    if approval.status != "Pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve request with current status '{approval.status}'.",
        )

    reviewer_email = current_user.get("id", "admin@edupilot.io")
    approval.status = "Approved"
    approval.reviewed_by = reviewer_email
    approval.reviewed_at = datetime.now(timezone.utc)
    approval.rejection_reason = None

    await db.commit()
    await db.refresh(approval)
    return approval


@router.post(
    "/{approval_id}/reject",
    response_model=ApprovalRequestResponse,
    dependencies=[Depends(require_roles(["super_admin", "admin"]))],
)
async def reject_request(
    approval_id: uuid.UUID,
    action: Optional[ApprovalActionRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Reject an administrative request with optional reason.
    Strictly enforced: only 'super_admin' or 'admin' can execute.
    Prevents duplicate decision on non-pending items.
    """
    approval = await db.get(ApprovalRequest, approval_id)
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval request '{approval_id}' not found.",
        )

    if approval.status != "Pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject request with current status '{approval.status}'.",
        )

    reviewer_email = current_user.get("id", "admin@edupilot.io")
    approval.status = "Rejected"
    approval.reviewed_by = reviewer_email
    approval.reviewed_at = datetime.now(timezone.utc)
    approval.rejection_reason = action.reason if action and action.reason else "Request rejected by administrator."

    await db.commit()
    await db.refresh(approval)
    return approval
