from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/attendance", tags=["Attendance"])


class AttendanceSummary(BaseModel):
    batch_code: str
    total_students: int
    present_today: int
    attendance_rate: str


@router.get("/summary", response_model=List[AttendanceSummary])
async def get_attendance_summary(current_user: dict = Depends(get_current_user)):
    return [
        {"batch_code": "FSW-2026-A", "total_students": 28, "present_today": 26, "attendance_rate": "92.8%"},
        {"batch_code": "DSAI-2026-B", "total_students": 22, "present_today": 18, "attendance_rate": "81.8%"},
    ]
