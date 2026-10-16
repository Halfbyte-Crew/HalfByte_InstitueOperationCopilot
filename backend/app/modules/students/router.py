from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/students", tags=["Students"])


class StudentResponse(BaseModel):
    id: str
    name: str
    email: str
    course: str
    batch: str
    status: str
    attendance: str


# Seeded mock dataset for initial phase
MOCK_STUDENTS = [
    {
        "id": "stu-1",
        "name": "Aarav Patel",
        "email": "aarav@example.com",
        "course": "Full-Stack Web Dev",
        "batch": "FSW-2026-A",
        "status": "Active",
        "attendance": "94%",
    },
    {
        "id": "stu-2",
        "name": "Sophia Miller",
        "email": "sophia.m@example.com",
        "course": "Data Science & AI",
        "batch": "DSAI-2026-B",
        "status": "Active",
        "attendance": "82%",
    },
    {
        "id": "stu-3",
        "name": "Rahul Sharma",
        "email": "rahul.s@example.com",
        "course": "Cloud & DevOps",
        "batch": "CDO-2026-A",
        "status": "At Risk",
        "attendance": "68%",
    },
]


@router.get("", response_model=List[StudentResponse])
async def list_students(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    results = MOCK_STUDENTS
    if search:
        s = search.lower()
        results = [r for r in results if s in r["name"].lower() or s in r["email"].lower()]
    if status:
        results = [r for r in results if r["status"].lower() == status.lower()]
    return results
