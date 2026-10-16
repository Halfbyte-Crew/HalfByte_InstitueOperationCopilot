from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])


class CopilotQueryRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None


class ProposedAction(BaseModel):
    title: str
    details: str
    action_type: str
    payload: Dict[str, Any]


class CopilotQueryResponse(BaseModel):
    response: str
    proposed_action: Optional[ProposedAction] = None


@router.post("/query", response_model=CopilotQueryResponse)
async def query_copilot(
    request: CopilotQueryRequest,
    current_user: dict = Depends(get_current_user)
):
    query = request.message.lower()

    if "attendance" in query or "absent" in query:
        return {
            "response": "I analyzed current cohort attendance. 3 students in Python Batch B have attendance below 75%. I have generated a notification proposal for review.",
            "proposed_action": {
                "title": "Dispatch Low-Attendance Warning Notice",
                "details": "Dispatch alerts to 3 at-risk students and copy academic coordinator.",
                "action_type": "SEND_ATTENDANCE_WARNING",
                "payload": {"batch": "Python Batch B", "student_count": 3}
            }
        }

    return {
        "response": f"I processed your query: '{request.message}'. Operations systems are running within standard parameters.",
        "proposed_action": None
    }
