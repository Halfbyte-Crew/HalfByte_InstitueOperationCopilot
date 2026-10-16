from datetime import date
from decimal import Decimal
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.institute import Student, StudentStatus
from app.schemas.institute import StudentCreate, StudentResponse, StudentUpdate

router = APIRouter(prefix="/students", tags=["Students"])


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    payload: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Check for duplicate email
    existing = await db.execute(select(Student).where(Student.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student with email '{payload.email}' already exists.",
        )

    student = Student(**payload.model_dump())
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student


@router.get("", response_model=List[StudentResponse])
async def list_students(
    search: Optional[str] = Query(None, description="Search by name or email"),
    status: Optional[StudentStatus] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    stmt = select(Student)
    if search:
        s = f"%{search.strip().lower()}%"
        stmt = stmt.where((func.lower(Student.name).like(s)) | (func.lower(Student.email).like(s)))
    if status:
        stmt = stmt.where(Student.status == status)

    stmt = stmt.order_by(Student.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id '{student_id}' not found.",
        )
    return student


@router.patch("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: uuid.UUID,
    payload: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id '{student_id}' not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] != student.email:
        existing = await db.execute(
            select(Student).where(Student.email == update_data["email"], Student.id != student_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{update_data['email']}' is already in use.",
            )

    for field, value in update_data.items():
        setattr(student, field, value)

    await db.commit()
    await db.refresh(student)
    return student
