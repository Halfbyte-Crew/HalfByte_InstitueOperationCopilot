"""
Dashboard API module — role-scoped summary endpoints.

Each endpoint independently enforces RBAC via require_roles().
Financial data is never included in trainer or student payloads.
"""
from decimal import Decimal
from typing import List, Optional, Dict, Any
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.institute import (
    AttendanceRecord,
    AttendanceStatus,
    Batch,
    BatchEnrollment,
    ClassSchedule,
    ClassScheduleStatus,
    Course,
    FeeInstallment,
    FeeStatus,
    Student,
    Trainer,
)
from app.modules.dashboard.admin_service import (
    acknowledge_alert,
    detect_scheduling_conflicts,
    get_admin_overview,
    get_operational_alerts,
    get_upcoming_classes,
)
from app.schemas.institute import (
    AdminOverviewResponse,
    ClassScheduleCreate,
    ClassScheduleUpdate,
    ConflictDetail,
    OperationalAlert,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ---------------------------------------------------------------------------
# Admin Dashboard — Operations, Scheduling & Real Governance Metrics
# ---------------------------------------------------------------------------

@router.get(
    "/admin/overview",
    response_model=AdminOverviewResponse,
    dependencies=[Depends(require_roles(["super_admin", "admin"]))],
)
async def admin_overview(db: AsyncSession = Depends(get_db)):
    """Institute-wide overview statistics (students, batches, trainers, upcoming classes, alerts)."""
    return await get_admin_overview(db)


@router.get(
    "/admin/upcoming-classes",
    dependencies=[Depends(require_roles(["super_admin", "admin"]))],
)
async def admin_upcoming_classes(
    limit: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Upcoming class sessions with trainer, room, and timing information."""
    return await get_upcoming_classes(db, limit=limit)


@router.get(
    "/admin/conflicts",
    response_model=List[ConflictDetail],
    dependencies=[Depends(require_roles(["super_admin", "admin"]))],
)
async def admin_conflicts(db: AsyncSession = Depends(get_db)):
    """Detects scheduling conflicts (trainer double-bookings, classroom conflicts)."""
    return await detect_scheduling_conflicts(db)


@router.get(
    "/admin/alerts",
    response_model=List[OperationalAlert],
    dependencies=[Depends(require_roles(["super_admin", "admin"]))],
)
async def admin_alerts(db: AsyncSession = Depends(get_db)):
    """Operational alerts panel (conflicts, missing trainers, pending approvals, AI health insights)."""
    return await get_operational_alerts(db)


@router.post(
    "/admin/alerts/{alert_id}/acknowledge",
    dependencies=[Depends(require_roles(["super_admin", "admin"]))],
)
async def acknowledge_admin_alert(alert_id: str):
    """Allows authorized admin to acknowledge or dismiss an alert."""
    acknowledge_alert(alert_id)
    return {"message": f"Alert '{alert_id}' acknowledged successfully."}


@router.post(
    "/admin/schedules",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["super_admin", "admin"]))],
)
async def create_class_schedule(
    payload: ClassScheduleCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new class schedule session."""
    batch = await db.get(Batch, payload.batch_id)
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch '{payload.batch_id}' not found.",
        )
    if payload.trainer_id:
        trainer = await db.get(Trainer, payload.trainer_id)
        if not trainer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Trainer '{payload.trainer_id}' not found.",
            )

    schedule = ClassSchedule(**payload.model_dump())
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return {"id": str(schedule.id), "message": "Class schedule created successfully."}


@router.patch(
    "/admin/schedules/{schedule_id}",
    dependencies=[Depends(require_roles(["super_admin", "admin"]))],
)
async def update_class_schedule(
    schedule_id: uuid.UUID,
    payload: ClassScheduleUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Updates or reassigns a class schedule (resolves conflicts safely)."""
    schedule = await db.get(ClassSchedule, schedule_id)
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class schedule '{schedule_id}' not found.",
        )

    data = payload.model_dump(exclude_unset=True)
    if "trainer_id" in data and data["trainer_id"]:
        trainer = await db.get(Trainer, data["trainer_id"])
        if not trainer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Trainer '{data['trainer_id']}' not found.",
            )

    for field, val in data.items():
        setattr(schedule, field, val)

    await db.commit()
    await db.refresh(schedule)
    return {"id": str(schedule.id), "message": "Class schedule updated successfully."}


@router.delete(
    "/admin/schedules/{schedule_id}",
    dependencies=[Depends(require_roles(["super_admin", "admin"]))],
)
async def delete_class_schedule(
    schedule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Cancels or deletes a scheduled class session."""
    schedule = await db.get(ClassSchedule, schedule_id)
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class schedule '{schedule_id}' not found.",
        )
    await db.delete(schedule)
    await db.commit()
    return {"message": "Class schedule deleted successfully."}


# ---------------------------------------------------------------------------
# Owner / Admin Legacy KPI Summary (Backward Compatible)
# ---------------------------------------------------------------------------

@router.get(
    "/owner/stats",
    dependencies=[Depends(require_roles(["super_admin", "admin"]))],
)
async def owner_stats(db: AsyncSession = Depends(get_db)):
    """Institute-wide KPI summary for owner/admin dashboard."""
    total_students = (await db.execute(select(func.count(Student.id)))).scalar() or 0
    total_batches = (await db.execute(select(func.count(Batch.id)))).scalar() or 0
    total_trainers = (await db.execute(select(func.count(Trainer.id)))).scalar() or 0
    total_courses = (await db.execute(select(func.count(Course.id)))).scalar() or 0

    # Fee summary
    total_due = (
        await db.execute(select(func.coalesce(func.sum(FeeInstallment.amount_due), Decimal("0.00"))))
    ).scalar() or Decimal("0.00")
    total_paid = (
        await db.execute(select(func.coalesce(func.sum(FeeInstallment.amount_paid), Decimal("0.00"))))
    ).scalar() or Decimal("0.00")
    total_outstanding = max(Decimal("0.00"), total_due - total_paid)

    overdue_count = (
        await db.execute(
            select(func.count(FeeInstallment.id)).where(FeeInstallment.status == FeeStatus.OVERDUE)
        )
    ).scalar() or 0

    return {
        "total_students": total_students,
        "active_batches": total_batches,
        "total_trainers": total_trainers,
        "total_courses": total_courses,
        "fee_summary": {
            "total_receivable": str(total_due),
            "total_collected": str(total_paid),
            "total_outstanding": str(total_outstanding),
            "overdue_installments": overdue_count,
        },
    }


# ---------------------------------------------------------------------------
# Counselor Dashboard
# ---------------------------------------------------------------------------

@router.get(
    "/counselor/summary",
    dependencies=[Depends(require_roles(["counselor", "coordinator", "admin", "super_admin"]))],
)
async def counselor_summary(db: AsyncSession = Depends(get_db)):
    """Counselor view: student pipeline and recent admissions."""
    total_students = (await db.execute(select(func.count(Student.id)))).scalar() or 0
    total_batches = (await db.execute(select(func.count(Batch.id)))).scalar() or 0
    total_courses = (await db.execute(select(func.count(Course.id)))).scalar() or 0

    # Most recently enrolled students (last 10)
    recent_students = (
        await db.execute(
            select(Student)
            .order_by(Student.created_at.desc())
            .limit(10)
        )
    ).scalars().all()

    students_list = [
        {
            "id": str(s.id),
            "name": s.name,
            "email": s.email,
            "phone": s.phone,
            "status": s.status.value if hasattr(s.status, "value") else str(s.status),
            "enrolled_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in recent_students
    ]

    return {
        "total_students": total_students,
        "active_batches": total_batches,
        "available_courses": total_courses,
        "recent_admissions": students_list,
    }


# ---------------------------------------------------------------------------
# Trainer Dashboard
# ---------------------------------------------------------------------------

@router.get(
    "/trainer/schedule",
    dependencies=[Depends(require_roles(["trainer", "admin", "super_admin"]))],
)
async def trainer_schedule(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trainer view: assigned batches and today's attendance summary.
    NEVER includes fee or financial data — RBAC enforced at schema level.
    """
    batches = (
        await db.execute(
            select(Batch).options(selectinload(Batch.course)).order_by(Batch.created_at.desc()).limit(20)
        )
    ).scalars().all()

    batch_summaries = []
    for batch in batches:
        enrolled_count = (
            await db.execute(
                select(func.count(BatchEnrollment.id)).where(BatchEnrollment.batch_id == batch.id)
            )
        ).scalar() or 0

        batch_name = batch.course.title if batch.course else batch.code
        batch_summaries.append(
            {
                "id": str(batch.id),
                "code": batch.code,
                "name": batch_name,
                "status": batch.status.value if hasattr(batch.status, "value") else str(batch.status),
                "enrolled_students": enrolled_count,
                "start_date": batch.start_date.isoformat() if batch.start_date else None,
                "end_date": batch.end_date.isoformat() if batch.end_date else None,
            }
        )

    return {
        "trainer_id": current_user.get("id"),
        "assigned_batches": batch_summaries,
        # financial fields deliberately omitted
    }


# ---------------------------------------------------------------------------
# Accounts / Finance Dashboard
# ---------------------------------------------------------------------------

@router.get(
    "/accounts/overview",
    dependencies=[Depends(require_roles(["finance", "admin", "super_admin"]))],
)
async def accounts_overview(db: AsyncSession = Depends(get_db)):
    """Finance team view: fee collection, overdue EMIs, reconciliation status."""
    total_due = (
        await db.execute(select(func.coalesce(func.sum(FeeInstallment.amount_due), Decimal("0.00"))))
    ).scalar() or Decimal("0.00")
    total_paid = (
        await db.execute(select(func.coalesce(func.sum(FeeInstallment.amount_paid), Decimal("0.00"))))
    ).scalar() or Decimal("0.00")
    total_outstanding = max(Decimal("0.00"), total_due - total_paid)

    paid_count = (
        await db.execute(
            select(func.count(FeeInstallment.id)).where(FeeInstallment.status == FeeStatus.PAID)
        )
    ).scalar() or 0
    overdue_count = (
        await db.execute(
            select(func.count(FeeInstallment.id)).where(FeeInstallment.status == FeeStatus.OVERDUE)
        )
    ).scalar() or 0
    pending_count = (
        await db.execute(
            select(func.count(FeeInstallment.id)).where(FeeInstallment.status == FeeStatus.PENDING)
        )
    ).scalar() or 0
    partial_count = (
        await db.execute(
            select(func.count(FeeInstallment.id)).where(FeeInstallment.status == FeeStatus.PARTIALLY_PAID)
        )
    ).scalar() or 0

    collection_rate = (
        f"{(total_paid / total_due * 100):.1f}%" if total_due > Decimal("0.00") else "0.0%"
    )

    # Recent installments list
    recent_installments_rows = (
        await db.execute(
            select(FeeInstallment, Student.name.label("student_name"))
            .join(Student, FeeInstallment.student_id == Student.id)
            .order_by(FeeInstallment.due_date.desc())
            .limit(15)
        )
    ).all()

    recent_installments = [
        {
            "id": str(row.FeeInstallment.id),
            "student_name": row.student_name,
            "amount_due": str(row.FeeInstallment.amount_due),
            "amount_paid": str(row.FeeInstallment.amount_paid),
            "status": row.FeeInstallment.status.value if hasattr(row.FeeInstallment.status, "value") else str(row.FeeInstallment.status),
            "due_date": row.FeeInstallment.due_date.isoformat() if row.FeeInstallment.due_date else None,
        }
        for row in recent_installments_rows
    ]

    return {
        "total_receivable": str(total_due),
        "total_collected": str(total_paid),
        "total_outstanding": str(total_outstanding),
        "collection_rate": collection_rate,
        "installment_counts": {
            "paid": paid_count,
            "overdue": overdue_count,
            "pending": pending_count,
            "partially_paid": partial_count,
        },
        "recent_installments": recent_installments,
    }


# ---------------------------------------------------------------------------
# Student Dashboard
# ---------------------------------------------------------------------------

@router.get(
    "/student/profile",
    dependencies=[Depends(require_roles(["student", "admin", "super_admin"]))],
)
async def student_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Student's personal dashboard view.
    Only returns the authenticated student's own records.
    """
    # For demo (Phase 3 scaffolding): return institute-wide stats without personal linking
    # In Phase 4, use current_user["id"] to fetch the real student record.
    total_courses = (await db.execute(select(func.count(Course.id)))).scalar() or 0
    total_batches = (await db.execute(select(func.count(Batch.id)))).scalar() or 0

    return {
        "student_id": current_user.get("id"),
        "demo_note": (
            "Phase 3 demo: personal student-record linking requires Phase 4 user-to-student "
            "mapping. Showing institute-level demo data."
        ),
        "enrolled_courses": total_courses,
        "active_batches": total_batches,
        # attendance and fee records deliberately omitted until student record linking implemented
    }
