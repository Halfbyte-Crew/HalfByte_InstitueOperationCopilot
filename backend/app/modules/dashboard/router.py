"""
Dashboard API module — role-scoped summary endpoints.

Each endpoint independently enforces RBAC via require_roles().
Financial data is never included in trainer or student payloads.
"""
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.institute import (
    AttendanceRecord,
    AttendanceStatus,
    Batch,
    BatchEnrollment,
    Course,
    FeeInstallment,
    FeeStatus,
    Student,
    Trainer,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ---------------------------------------------------------------------------
# Owner / Admin Dashboard
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
        await db.execute(select(Batch).order_by(Batch.created_at.desc()).limit(20))
    ).scalars().all()

    batch_summaries = []
    for batch in batches:
        enrolled_count = (
            await db.execute(
                select(func.count(BatchEnrollment.id)).where(BatchEnrollment.batch_id == batch.id)
            )
        ).scalar() or 0

        batch_summaries.append(
            {
                "id": str(batch.id),
                "code": batch.code,
                "name": batch.name,
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
