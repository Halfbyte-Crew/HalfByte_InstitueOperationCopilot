"""
Admin Dashboard Service — Institute-wide operational metrics,
upcoming classes, schedule conflict detection, and operational alerts.
"""
from datetime import date, datetime, timezone
import hashlib
from typing import List, Dict, Any, Optional
import uuid
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.institute import (
    ApprovalRequest,
    Batch,
    BatchStatus,
    ClassSchedule,
    ClassScheduleStatus,
    Course,
    StaffMember,
    Student,
    StudentStatus,
    Trainer,
)
from app.schemas.institute import (
    AdminOverviewResponse,
    ConflictDetail,
    OperationalAlert,
)


# In-memory store for acknowledged alert IDs during process runtime
_ACKNOWLEDGED_ALERT_IDS: set[str] = set()


def _times_overlap(start1: str, end1: str, start2: str, end2: str) -> bool:
    """Returns True if time interval [start1, end1) overlaps with [start2, end2)."""
    return start1 < end2 and start2 < end1


def _calculate_overlap_window(start1: str, end1: str, start2: str, end2: str) -> str:
    """Calculates the overlapping sub-window."""
    overlap_start = max(start1, start2)
    overlap_end = min(end1, end2)
    return f"{overlap_start} - {overlap_end}"


async def get_admin_overview(db: AsyncSession) -> AdminOverviewResponse:
    """
    Computes accurate institute-wide statistics from real database records.
    Filters out archived or inactive records where appropriate.
    """
    today = date.today()

    # Total active / enrolled students
    total_students = (
        await db.execute(
            select(func.count(Student.id)).where(
                Student.status.in_([StudentStatus.ACTIVE, StudentStatus.ENROLLED])
            )
        )
    ).scalar() or 0

    # Total active / upcoming batches
    total_batches = (
        await db.execute(
            select(func.count(Batch.id)).where(
                Batch.status.in_([BatchStatus.ACTIVE, BatchStatus.UPCOMING])
            )
        )
    ).scalar() or 0

    # Total trainers (faculty)
    total_trainers = (await db.execute(select(func.count(Trainer.id)))).scalar() or 0

    # Upcoming classes (scheduled today or later with status SCHEDULED)
    upcoming_classes = (
        await db.execute(
            select(func.count(ClassSchedule.id)).where(
                ClassSchedule.scheduled_date >= today,
                ClassSchedule.status == ClassScheduleStatus.SCHEDULED,
            )
        )
    ).scalar() or 0

    # Pending approvals
    pending_approvals = (
        await db.execute(
            select(func.count(ApprovalRequest.id)).where(
                ApprovalRequest.status == "Pending"
            )
        )
    ).scalar() or 0

    # Real conflicts count
    conflicts = await detect_scheduling_conflicts(db)
    active_conflicts_count = len(conflicts)

    # Alerts count
    alerts = await get_operational_alerts(db)
    operational_alerts_count = len(alerts)

    return AdminOverviewResponse(
        total_students=total_students,
        total_batches=total_batches,
        total_trainers=total_trainers,
        upcoming_classes=upcoming_classes,
        pending_approvals_count=pending_approvals,
        active_conflicts_count=active_conflicts_count,
        operational_alerts_count=operational_alerts_count,
        institute_name="EduPilot Institute of Operations & Technology",
        current_term="Fall 2026 Cohort",
    )


async def get_upcoming_classes(
    db: AsyncSession,
    limit: int = 30,
    from_date: Optional[date] = None,
) -> List[Dict[str, Any]]:
    """Fetches upcoming class schedules with full batch, course, and trainer relationships."""
    target_date = from_date or date.today()

    stmt = (
        select(ClassSchedule)
        .options(
            selectinload(ClassSchedule.batch).selectinload(Batch.course),
            selectinload(ClassSchedule.trainer),
        )
        .where(
            ClassSchedule.scheduled_date >= target_date,
            ClassSchedule.status != ClassScheduleStatus.CANCELLED,
        )
        .order_by(ClassSchedule.scheduled_date.asc(), ClassSchedule.start_time.asc())
        .limit(limit)
    )

    results = (await db.execute(stmt)).scalars().all()

    class_list = []
    for s in results:
        batch_code = s.batch.code if s.batch else "—"
        course_title = s.batch.course.title if (s.batch and s.batch.course) else "—"
        trainer_name = s.trainer.name if s.trainer else "Unassigned"

        class_list.append(
            {
                "id": str(s.id),
                "batch_id": str(s.batch_id),
                "batch_code": batch_code,
                "course_title": course_title,
                "trainer_id": str(s.trainer_id) if s.trainer_id else None,
                "trainer_name": trainer_name,
                "title": s.title,
                "scheduled_date": s.scheduled_date.isoformat(),
                "start_time": s.start_time,
                "end_time": s.end_time,
                "classroom": s.classroom or "Virtual Room",
                "meeting_link": s.meeting_link,
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
            }
        )

    return class_list


async def detect_scheduling_conflicts(db: AsyncSession) -> List[ConflictDetail]:
    """
    Deterministically detects scheduling conflicts in upcoming records:
    1. Trainer assigned to 2 or more overlapping classes on the same date.
    2. Same physical classroom double-booked at overlapping times on the same date.
    """
    today = date.today()

    stmt = (
        select(ClassSchedule)
        .options(
            selectinload(ClassSchedule.batch).selectinload(Batch.course),
            selectinload(ClassSchedule.trainer),
        )
        .where(
            ClassSchedule.scheduled_date >= today,
            ClassSchedule.status == ClassScheduleStatus.SCHEDULED,
        )
        .order_by(ClassSchedule.scheduled_date.asc(), ClassSchedule.start_time.asc())
    )

    schedules = (await db.execute(stmt)).scalars().all()

    conflicts: List[ConflictDetail] = []
    seen_pairs: set[tuple[str, str, str]] = set()

    for i in range(len(schedules)):
        for j in range(i + 1, len(schedules)):
            s1 = schedules[i]
            s2 = schedules[j]

            if s1.scheduled_date != s2.scheduled_date:
                continue

            if not _times_overlap(s1.start_time, s1.end_time, s2.start_time, s2.end_time):
                continue

            overlap_window = _calculate_overlap_window(
                s1.start_time, s1.end_time, s2.start_time, s2.end_time
            )

            # Check 1: Trainer Overlap
            if (
                s1.trainer_id is not None
                and s2.trainer_id is not None
                and s1.trainer_id == s2.trainer_id
            ):
                trainer_name = s1.trainer.name if s1.trainer else "Faculty Member"
                pair_key = (str(s1.trainer_id), "TRAINER_OVERLAP", s1.scheduled_date.isoformat())
                if pair_key not in seen_pairs:
                    seen_pairs.add(pair_key)
                    c_id = hashlib.md5(
                        f"trainer-{s1.id}-{s2.id}".encode()
                    ).hexdigest()[:10]

                    conflicts.append(
                        ConflictDetail(
                            conflict_id=f"cnf-{c_id}",
                            conflict_type="TRAINER_OVERLAP",
                            severity="CRITICAL",
                            title=f"Faculty Overlap: {trainer_name}",
                            description=(
                                f"{trainer_name} is double-booked across '{s1.title}' "
                                f"and '{s2.title}' with overlapping duration."
                            ),
                            scheduled_date=s1.scheduled_date.isoformat(),
                            overlapping_time=overlap_window,
                            affected_entity=trainer_name,
                            affected_sessions=[
                                {
                                    "schedule_id": str(s1.id),
                                    "title": s1.title,
                                    "batch_code": s1.batch.code if s1.batch else "",
                                    "time": f"{s1.start_time} - {s1.end_time}",
                                    "classroom": s1.classroom,
                                },
                                {
                                    "schedule_id": str(s2.id),
                                    "title": s2.title,
                                    "batch_code": s2.batch.code if s2.batch else "",
                                    "time": f"{s2.start_time} - {s2.end_time}",
                                    "classroom": s2.classroom,
                                },
                            ],
                            resolution_hint="Reassign faculty or adjust scheduled time window.",
                        )
                    )

            # Check 2: Classroom Double Booking
            if (
                s1.classroom
                and s2.classroom
                and s1.classroom.strip().lower() == s2.classroom.strip().lower()
            ):
                room_name = s1.classroom.strip()
                pair_key = (room_name.lower(), "ROOM_DOUBLE_BOOKING", s1.scheduled_date.isoformat())
                if pair_key not in seen_pairs:
                    seen_pairs.add(pair_key)
                    c_id = hashlib.md5(
                        f"room-{s1.id}-{s2.id}".encode()
                    ).hexdigest()[:10]

                    conflicts.append(
                        ConflictDetail(
                            conflict_id=f"cnf-{c_id}",
                            conflict_type="ROOM_DOUBLE_BOOKING",
                            severity="HIGH",
                            title=f"Facility Double-Booking: {room_name}",
                            description=(
                                f"Physical room '{room_name}' is scheduled simultaneously for "
                                f"Batch {s1.batch.code if s1.batch else ''} and {s2.batch.code if s2.batch else ''}."
                            ),
                            scheduled_date=s1.scheduled_date.isoformat(),
                            overlapping_time=overlap_window,
                            affected_entity=room_name,
                            affected_sessions=[
                                {
                                    "schedule_id": str(s1.id),
                                    "title": s1.title,
                                    "batch_code": s1.batch.code if s1.batch else "",
                                    "time": f"{s1.start_time} - {s1.end_time}",
                                    "trainer": s1.trainer.name if s1.trainer else "Unassigned",
                                },
                                {
                                    "schedule_id": str(s2.id),
                                    "title": s2.title,
                                    "batch_code": s2.batch.code if s2.batch else "",
                                    "time": f"{s2.start_time} - {s2.end_time}",
                                    "trainer": s2.trainer.name if s2.trainer else "Unassigned",
                                },
                            ],
                            resolution_hint="Move one class session to an alternate laboratory or lecture room.",
                        )
                    )

    return conflicts


async def get_operational_alerts(db: AsyncSession) -> List[OperationalAlert]:
    """
    Builds verified operational alerts from current database state.
    Distinguishes deterministic system alerts from AI-assisted synthesis insights.
    """
    today = date.today()
    alerts: List[OperationalAlert] = []

    # 1. Conflicts
    conflicts = await detect_scheduling_conflicts(db)
    for c in conflicts:
        alert_id = f"alert-conf-{c.conflict_id}"
        if alert_id in _ACKNOWLEDGED_ALERT_IDS:
            continue
        alerts.append(
            OperationalAlert(
                id=alert_id,
                severity=c.severity,
                title=c.title,
                explanation=f"{c.description} Time overlap: {c.overlapping_time} on {c.scheduled_date}.",
                relevant_date=c.scheduled_date,
                affected_entity=c.affected_entity,
                action_label="Review Schedule",
                action_link="/operations",
                is_ai_generated=False,
                is_acknowledged=False,
            )
        )

    # 2. Upcoming classes with missing trainer
    unassigned_stmt = (
        select(ClassSchedule)
        .options(selectinload(ClassSchedule.batch))
        .where(
            ClassSchedule.scheduled_date >= today,
            ClassSchedule.status == ClassScheduleStatus.SCHEDULED,
            ClassSchedule.trainer_id.is_(None),
        )
        .order_by(ClassSchedule.scheduled_date.asc())
    )
    unassigned = (await db.execute(unassigned_stmt)).scalars().all()
    for u in unassigned:
        alert_id = f"alert-unassigned-{u.id}"
        if alert_id in _ACKNOWLEDGED_ALERT_IDS:
            continue
        batch_name = u.batch.code if u.batch else "Unknown Batch"
        alerts.append(
            OperationalAlert(
                id=alert_id,
                severity="HIGH",
                title=f"Missing Trainer Assignment: {batch_name}",
                explanation=(
                    f"Class '{u.title}' on {u.scheduled_date.isoformat()} ({u.start_time}-{u.end_time}) "
                    f"has no faculty member assigned."
                ),
                relevant_date=u.scheduled_date.isoformat(),
                affected_entity=batch_name,
                action_label="Assign Faculty",
                action_link="/operations",
                is_ai_generated=False,
                is_acknowledged=False,
            )
        )

    # 3. Pending approvals
    pending_approvals = (
        await db.execute(
            select(ApprovalRequest).where(ApprovalRequest.status == "Pending").order_by(ApprovalRequest.created_at.asc())
        )
    ).scalars().all()

    if pending_approvals:
        alert_id = "alert-pending-approvals"
        if alert_id not in _ACKNOWLEDGED_ALERT_IDS:
            oldest = pending_approvals[0]
            alerts.append(
                OperationalAlert(
                    id=alert_id,
                    severity="MEDIUM",
                    title=f"{len(pending_approvals)} Pending Action Approvals",
                    explanation=(
                        f"Earliest pending request: '{oldest.title}' submitted by "
                        f"{oldest.requester_name} ({oldest.requester_role}) requires review."
                    ),
                    relevant_date=oldest.created_at.strftime("%Y-%m-%d") if oldest.created_at else None,
                    affected_entity=f"{len(pending_approvals)} Requests",
                    action_label="Review Approvals",
                    action_link="/approvals",
                    is_ai_generated=False,
                    is_acknowledged=False,
                )
            )

    # 4. AI-synthesized operational summary insight (clearly marked)
    ai_alert_id = "alert-ai-summary"
    if ai_alert_id not in _ACKNOWLEDGED_ALERT_IDS:
        active_cohort_count = (
            await db.execute(
                select(func.count(Batch.id)).where(Batch.status == BatchStatus.ACTIVE)
            )
        ).scalar() or 0

        summary_text = (
            f"Operations scan completed across {active_cohort_count} active cohort(s). "
            f"{len(conflicts)} scheduling conflict(s) detected. "
            f"Recommend prioritizing faculty assignment for unassigned sessions before term week 5."
        )
        alerts.append(
            OperationalAlert(
                id=ai_alert_id,
                severity="INFO",
                title="AI Operations Health Synthesis",
                explanation=summary_text,
                relevant_date=date.today().isoformat(),
                affected_entity="Institute Operations",
                action_label="View Analytics",
                action_link="/operations",
                is_ai_generated=True,
                is_acknowledged=False,
            )
        )

    return alerts


def acknowledge_alert(alert_id: str) -> bool:
    """Marks an alert ID as acknowledged in memory."""
    _ACKNOWLEDGED_ALERT_IDS.add(alert_id)
    return True
