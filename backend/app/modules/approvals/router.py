from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.dependencies import require_roles

router = APIRouter(
    prefix="/approvals",
    tags=["Approvals"],
    dependencies=[Depends(require_roles(["super_admin", "admin", "coordinator"]))]
)


class ApprovalItem(BaseModel):
    id: str
    action_type: str
    title: str
    submitted_by: str
    created_at: str
    status: str
    payload: Dict[str, Any]


@router.get("", response_model=List[ApprovalItem])
async def list_pending_approvals():
    return [
        {
            "id": "appr-101",
            "action_type": "SEND_ATTENDANCE_WARNING",
            "title": "Low-attendance warning email dispatch for Batch Python-B",
            "submitted_by": "AI Copilot",
            "created_at": "2026-10-16T10:00:00Z",
            "status": "PENDING",
            "payload": {"batch_id": "btc-2", "affected_students": ["stu-3"]}
        }
    ]
