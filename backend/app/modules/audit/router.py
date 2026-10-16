from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.dependencies import require_roles

router = APIRouter(
    prefix="/audit",
    tags=["Audit Logs"],
    dependencies=[Depends(require_roles(["super_admin", "admin"]))]
)


class AuditEvent(BaseModel):
    id: str
    actor_email: str
    action: str
    entity: str
    timestamp: str
    details: str


@router.get("", response_model=List[AuditEvent])
async def list_audit_events():
    return [
        {
            "id": "aud-1",
            "actor_email": "admin@edupilot.io",
            "action": "SYSTEM_INITIALIZED",
            "entity": "System",
            "timestamp": "2026-10-16T12:00:00Z",
            "details": "EduPilot operational foundation established successfully."
        }
    ]
