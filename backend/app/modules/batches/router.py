from datetime import date
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.institute import Batch, BatchEnrollment, BatchStatus, Course, EnrollmentStatus, Student, Trainer
from app.schemas.institute import (
    BatchCreate,
    BatchResponse,
    BatchUpdate,
    EnrollmentCreate,
    EnrollmentResponse,
    EnrollmentUpdate,
)

router = APIRouter(prefix="/batches", tags=["Batches"])


@router.post("", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
async def create_batch(
    payload: BatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    code_normalized = payload.code.strip().upper()
    existing = await db.execute(select(Batch).where(Batch.code == code_normalized))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Batch with code '{code_normalized}' already exists.",
        )

    # Validate foreign keys
    course = await db.get(Course, payload.course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id '{payload.course_id}' does not exist.",
        )

    if payload.trainer_id:
        trainer = await db.get(Trainer, payload.trainer_id)
        if not trainer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Trainer with id '{payload.trainer_id}' does not exist.",
            )

    data = payload.model_dump()
    data["code"] = code_normalized
    batch = Batch(**data)
    db.add(batch)
    await db.commit()
    await db.refresh(batch)
    return batch


@router.get("", response_model=List[BatchResponse])
async def list_batches(
    course_id: Optional[uuid.UUID] = Query(None),
    trainer_id: Optional[uuid.UUID] = Query(None),
    status: Optional[BatchStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    stmt = select(Batch)
    if course_id:
        stmt = stmt.where(Batch.course_id == course_id)
    if trainer_id:
        stmt = stmt.where(Batch.trainer_id == trainer_id)
    if status:
        stmt = stmt.where(Batch.status == status)

    stmt = stmt.order_by(Batch.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{batch_id}", response_model=BatchResponse)
async def get_batch(
    batch_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with id '{batch_id}' not found.",
        )
    return batch


@router.patch("/{batch_id}", response_model=BatchResponse)
async def update_batch(
    batch_id: uuid.UUID,
    payload: BatchUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with id '{batch_id}' not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "code" in update_data:
        code_normalized = update_data["code"].strip().upper()
        existing = await db.execute(
            select(Batch).where(Batch.code == code_normalized, Batch.id != batch_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Batch code '{code_normalized}' is already in use.",
            )
        update_data["code"] = code_normalized

    if "course_id" in update_data and update_data["course_id"]:
        course = await db.get(Course, update_data["course_id"])
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course with id '{update_data['course_id']}' does not exist.",
            )

    if "trainer_id" in update_data and update_data["trainer_id"]:
        trainer = await db.get(Trainer, update_data["trainer_id"])
        if not trainer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Trainer with id '{update_data['trainer_id']}' does not exist.",
            )

    for field, value in update_data.items():
        setattr(batch, field, value)

    await db.commit()
    await db.refresh(batch)
    return batch


# ---------------------------------------------------------
# Batch Enrollment Endpoints
# ---------------------------------------------------------

@router.post("/{batch_id}/enrollments", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def enroll_student(
    batch_id: uuid.UUID,
    payload: EnrollmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    student = await db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    # Check for existing enrollment
    existing = await db.execute(
        select(BatchEnrollment).where(
            BatchEnrollment.batch_id == batch_id, BatchEnrollment.student_id == payload.student_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student is already enrolled in this batch.",
        )

    enrollment = BatchEnrollment(
        batch_id=batch_id,
        student_id=payload.student_id,
        enrolled_on=payload.enrolled_on or date.today(),
        status=payload.status,
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment


@router.get("/{batch_id}/enrollments", response_model=List[EnrollmentResponse])
async def list_batch_enrollments(
    batch_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    batch = await db.get(Batch, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    stmt = select(BatchEnrollment).where(BatchEnrollment.batch_id == batch_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())
