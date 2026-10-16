from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.institute import Course
from app.schemas.institute import CourseCreate, CourseResponse, CourseUpdate

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    code_normalized = payload.code.strip().upper()
    existing = await db.execute(select(Course).where(Course.code == code_normalized))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Course with code '{code_normalized}' already exists.",
        )

    data = payload.model_dump()
    data["code"] = code_normalized
    course = Course(**data)
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@router.get("", response_model=List[CourseResponse])
async def list_courses(
    search: Optional[str] = Query(None, description="Search by code or title"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    stmt = select(Course)
    if search:
        s = f"%{search.strip().lower()}%"
        stmt = stmt.where((func.lower(Course.code).like(s)) | (func.lower(Course.title).like(s)))
    stmt = stmt.order_by(Course.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id '{course_id}' not found.",
        )
    return course


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: uuid.UUID,
    payload: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id '{course_id}' not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "code" in update_data:
        code_normalized = update_data["code"].strip().upper()
        existing = await db.execute(
            select(Course).where(Course.code == code_normalized, Course.id != course_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Course code '{code_normalized}' is already in use.",
            )
        update_data["code"] = code_normalized

    for field, value in update_data.items():
        setattr(course, field, value)

    await db.commit()
    await db.refresh(course)
    return course
