from datetime import date
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.institute import AttendanceRecord, AttendanceStatus, Batch, BatchEnrollment, Student
from app.schemas.institute import (
    AttendanceRecordCreate,
    AttendanceRecordResponse,
    AttendanceRecordUpdate,
    AttendanceSummaryItem,
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("", response_model=AttendanceRecordResponse, status_code=status.HTTP_201_CREATED)
async def mark_attendance(
    payload: AttendanceRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Verify student & batch exist
    student = await db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id '{payload.student_id}' not found.",
        )

    batch = await db.get(Batch, payload.batch_id)
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with id '{payload.batch_id}' not found.",
        )

    # Check for duplicate attendance record on same date
    existing = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.student_id == payload.student_id,
            AttendanceRecord.batch_id == payload.batch_id,
            AttendanceRecord.session_date == payload.session_date,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Attendance for student '{payload.student_id}' in batch '{payload.batch_id}' on date '{payload.session_date}' is already recorded.",
        )

    record = AttendanceRecord(**payload.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("", response_model=List[AttendanceRecordResponse])
async def list_attendance(
    batch_id: Optional[uuid.UUID] = Query(None),
    student_id: Optional[uuid.UUID] = Query(None),
    session_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    stmt = select(AttendanceRecord)
    if batch_id:
        stmt = stmt.where(AttendanceRecord.batch_id == batch_id)
    if student_id:
        stmt = stmt.where(AttendanceRecord.student_id == student_id)
    if session_date:
        stmt = stmt.where(AttendanceRecord.session_date == session_date)

    stmt = stmt.order_by(AttendanceRecord.session_date.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/summary", response_model=List[AttendanceSummaryItem])
async def get_attendance_summary(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    today = date.today()
    batches = (await db.execute(select(Batch))).scalars().all()
    summaries = []

    for b in batches:
        # Count total enrolled
        enrolled_res = await db.execute(
            select(func.count(BatchEnrollment.id)).where(BatchEnrollment.batch_id == b.id)
        )
        total_students = enrolled_res.scalar() or 0

        # Count present today
        present_res = await db.execute(
            select(func.count(AttendanceRecord.id)).where(
                AttendanceRecord.batch_id == b.id,
                AttendanceRecord.session_date == today,
                AttendanceRecord.status == AttendanceStatus.PRESENT,
            )
        )
        present_today = present_res.scalar() or 0

        rate = f"{(present_today / total_students * 100):.1f}%" if total_students > 0 else "0.0%"
        summaries.append(
            AttendanceSummaryItem(
                batch_id=b.id,
                batch_code=b.code,
                total_students=total_students,
                present_today=present_today,
                attendance_rate=rate,
            )
        )

    return summaries
