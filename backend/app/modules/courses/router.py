from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/courses", tags=["Courses"])


class CourseResponse(BaseModel):
    id: str
    code: str
    title: str
    duration_weeks: int


@router.get("", response_model=List[CourseResponse])
async def list_courses(current_user: dict = Depends(get_current_user)):
    return [
        {"id": "crs-1", "code": "FSW", "title": "Full-Stack Web Development", "duration_weeks": 16},
        {"id": "crs-2", "code": "DSAI", "title": "Data Science & Applied AI", "duration_weeks": 20},
        {"id": "crs-3", "code": "CDO", "title": "Cloud Architecture & DevOps", "duration_weeks": 12},
    ]
