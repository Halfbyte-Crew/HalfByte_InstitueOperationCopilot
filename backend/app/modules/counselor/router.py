import logging
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.institute import (
    Admission,
    ApprovalRequest,
    Batch,
    BatchEnrollment,
    Course,
    CounselorTask,
    Enquiry,
    InteractionLog,
    Student,
    StudentStatus,
)
from app.modules.counselor.schemas import (
    AdmissionDetailResponse,
    AdmissionResponse,
    AdmissionUpdate,
    CounselorStudentResponse,
    CounselorSummaryMetrics,
    EnquiryConvertRequest,
    EnquiryCreate,
    EnquiryDetailResponse,
    EnquiryResponse,
    EnquiryUpdate,
    InteractionCreate,
    InteractionResponse,
    PipelineStageCount,
    SubmitApprovalRequest,
    TaskCreate,
    TaskRescheduleRequest,
    TaskResponse,
    TaskUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/counselor",
    tags=["Counselor Operations"],
    dependencies=[Depends(require_roles(["counselor", "coordinator", "admin", "super_admin"]))],
)

PERMITTED_ADMISSION_STAGES = [
    "New Enquiry",
    "Contacted",
    "Counseling Scheduled",
    "Application Started",
    "Documents Pending",
    "Documents Under Review",
    "Admission Approved",
    "Enrolled",
    "Rejected",
    "Withdrawn",
]


def _is_admin(user: dict) -> bool:
    return user.get("role") in ["admin", "super_admin"]


def _verify_counselor_ownership(user: dict, assigned_email: str, resource_name: str = "record"):
    if not _is_admin(user) and assigned_email.lower() != user["id"].lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. This {resource_name} is assigned to another counselor.",
        )


# ===========================================================================
# 1. Operational Overview & Summary
# ===========================================================================

@router.get("/summary", response_model=CounselorSummaryMetrics)
async def get_counselor_summary(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns real operational KPI counts and task queues for the authenticated counselor.
    """
    user_email = current_user["id"].lower()
    is_admin_user = _is_admin(current_user)
    today = date.today()
    now = datetime.now(timezone.utc)
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_today = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Base filters
    enq_filter = True if is_admin_user else func.lower(Enquiry.assigned_counselor_email) == user_email
    adm_filter = True if is_admin_user else func.lower(Admission.assigned_counselor_email) == user_email
    task_filter = True if is_admin_user else func.lower(CounselorTask.assigned_counselor_email) == user_email

    # 1. Summary Cards
    assigned_enquiries = (
        await db.execute(select(func.count(Enquiry.id)).where(enq_filter))
    ).scalar() or 0

    active_admissions = (
        await db.execute(
            select(func.count(Admission.id)).where(
                and_(adm_filter, Admission.stage.notin_(["Rejected", "Withdrawn", "Enrolled"]))
            )
        )
    ).scalar() or 0

    followups_due_today = (
        await db.execute(
            select(func.count(CounselorTask.id)).where(
                and_(
                    task_filter,
                    CounselorTask.status == "Pending",
                    CounselorTask.due_datetime >= start_of_today,
                    CounselorTask.due_datetime <= end_of_today,
                )
            )
        )
    ).scalar() or 0

    overdue_followups = (
        await db.execute(
            select(func.count(CounselorTask.id)).where(
                and_(
                    task_filter,
                    CounselorTask.status == "Pending",
                    CounselorTask.due_datetime < start_of_today,
                )
            )
        )
    ).scalar() or 0

    # 2. Admission Pipeline Summary
    stage_counts_res = await db.execute(
        select(Admission.stage, func.count(Admission.id))
        .where(adm_filter)
        .group_by(Admission.stage)
    )
    raw_stage_map = {stage: count for stage, count in stage_counts_res.fetchall()}
    pipeline_summary = [
        PipelineStageCount(stage=stg, count=raw_stage_map.get(stg, 0))
        for stg in PERMITTED_ADMISSION_STAGES
        if raw_stage_map.get(stg, 0) > 0 or stg in ["Application Started", "Documents Pending", "Documents Under Review"]
    ]

    # 3. Tasks Due Today
    tasks_today_res = await db.execute(
        select(CounselorTask)
        .where(
            and_(
                task_filter,
                CounselorTask.status == "Pending",
                CounselorTask.due_datetime >= start_of_today,
                CounselorTask.due_datetime <= end_of_today,
            )
        )
        .order_by(CounselorTask.due_datetime.asc())
        .limit(10)
    )
    today_tasks = [
        {
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "due_datetime": t.due_datetime.isoformat(),
            "priority": t.priority,
            "status": t.status,
            "enquiry_id": str(t.enquiry_id) if t.enquiry_id else None,
            "admission_id": str(t.admission_id) if t.admission_id else None,
        }
        for t in tasks_today_res.scalars().all()
    ]

    # 4. Upcoming Reminders (next 7 days)
    tasks_upcoming_res = await db.execute(
        select(CounselorTask)
        .where(
            and_(
                task_filter,
                CounselorTask.status == "Pending",
                CounselorTask.due_datetime > end_of_today,
                CounselorTask.due_datetime <= (now + timedelta(days=7)),
            )
        )
        .order_by(CounselorTask.due_datetime.asc())
        .limit(10)
    )
    upcoming_reminders = [
        {
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "due_datetime": t.due_datetime.isoformat(),
            "priority": t.priority,
            "status": t.status,
            "enquiry_id": str(t.enquiry_id) if t.enquiry_id else None,
            "admission_id": str(t.admission_id) if t.admission_id else None,
        }
        for t in tasks_upcoming_res.scalars().all()
    ]

    # 5. Recently Updated Enquiries
    recent_enquiries_res = await db.execute(
        select(Enquiry)
        .where(enq_filter)
        .order_by(Enquiry.updated_at.desc())
        .limit(5)
    )
    recent_enquiries = [
        {
            "id": str(e.id),
            "name": e.name,
            "email": e.email,
            "phone": e.phone,
            "course_name": e.course_name,
            "status": e.status,
            "next_follow_up_date": e.next_follow_up_date.isoformat() if e.next_follow_up_date else None,
            "updated_at": e.updated_at.isoformat(),
        }
        for e in recent_enquiries_res.scalars().all()
    ]

    # 6. Admissions Requiring Action
    admissions_action_res = await db.execute(
        select(Admission)
        .where(
            and_(
                adm_filter,
                Admission.stage.in_(["Application Started", "Documents Pending", "Documents Under Review"]),
            )
        )
        .order_by(Admission.follow_up_due_date.asc().nulls_last())
        .limit(6)
    )
    admissions_requiring_action = [
        {
            "id": str(a.id),
            "student_name": a.student_name,
            "course_title": a.course_title,
            "stage": a.stage,
            "pending_requirements": a.pending_requirements,
            "next_action": a.next_action,
            "follow_up_due_date": a.follow_up_due_date.isoformat() if a.follow_up_due_date else None,
        }
        for a in admissions_action_res.scalars().all()
    ]

    # 7. Next Actions (Prioritized)
    next_actions = []
    # Add overdue tasks first
    overdue_tasks_res = await db.execute(
        select(CounselorTask)
        .where(
            and_(
                task_filter,
                CounselorTask.status == "Pending",
                CounselorTask.due_datetime < start_of_today,
            )
        )
        .order_by(CounselorTask.due_datetime.asc())
        .limit(3)
    )
    for ot in overdue_tasks_res.scalars().all():
        next_actions.append({
            "action_type": "Overdue Follow-up",
            "title": ot.title,
            "entity_id": str(ot.enquiry_id or ot.admission_id or ot.id),
            "priority": "Urgent",
            "description": f"Due on {ot.due_datetime.strftime('%b %d, %H:%M')}",
            "route": f"/dashboard/counselor?tab=followups"
        })

    # Add uncontacted new enquiries
    new_enq_res = await db.execute(
        select(Enquiry)
        .where(and_(enq_filter, Enquiry.status == "New"))
        .order_by(Enquiry.created_at.asc())
        .limit(3)
    )
    for ne in new_enq_res.scalars().all():
        next_actions.append({
            "action_type": "New Enquiry Contact",
            "title": f"Initial Call: {ne.name}",
            "entity_id": str(ne.id),
            "priority": "High",
            "description": f"Interested in {ne.course_name or 'programme'}. Not contacted yet.",
            "route": f"/dashboard/counselor?tab=enquiries"
        })

    return CounselorSummaryMetrics(
        assigned_enquiries=assigned_enquiries,
        active_admissions=active_admissions,
        followups_due_today=followups_due_today,
        overdue_followups=overdue_followups,
        pipeline_summary=pipeline_summary,
        today_tasks=today_tasks,
        upcoming_reminders=upcoming_reminders,
        recent_enquiries=recent_enquiries,
        admissions_requiring_action=admissions_requiring_action,
        next_actions=next_actions,
    )


# ===========================================================================
# 2. My Enquiries Workspace
# ===========================================================================

@router.get("/enquiries", response_model=Dict[str, Any])
async def list_counselor_enquiries(
    search: Optional[str] = Query(None, description="Search by name, email, phone"),
    status: Optional[str] = Query(None, description="Filter by enquiry status"),
    course_id: Optional[uuid.UUID] = Query(None, description="Filter by course"),
    source: Optional[str] = Query(None, description="Filter by source"),
    sort_by: Optional[str] = Query("recent", description="recent, created_at, next_follow_up"),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List enquiries assigned to the authenticated counselor with search, filters, and pagination.
    """
    user_email = current_user["id"].lower()
    stmt = select(Enquiry)

    if not _is_admin(current_user):
        stmt = stmt.where(func.lower(Enquiry.assigned_counselor_email) == user_email)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Enquiry.name).like(term),
                func.lower(Enquiry.email).like(term),
                func.lower(Enquiry.phone).like(term),
                func.lower(Enquiry.course_name).like(term),
            )
        )

    if status and status.strip():
        stmt = stmt.where(Enquiry.status == status.strip())

    if course_id:
        stmt = stmt.where(Enquiry.course_id == course_id)

    if source and source.strip():
        stmt = stmt.where(Enquiry.source == source.strip())

    # Sorting
    if sort_by == "created_at":
        stmt = stmt.order_by(Enquiry.created_at.desc())
    elif sort_by == "next_follow_up":
        stmt = stmt.order_by(Enquiry.next_follow_up_date.asc().nulls_last())
    else:
        stmt = stmt.order_by(Enquiry.updated_at.desc())

    # Total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_count = (await db.execute(count_stmt)).scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    items = (await db.execute(stmt)).scalars().all()

    return {
        "items": [EnquiryResponse.model_validate(i) for i in items],
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total_count + page_size - 1) // page_size),
    }


@router.post("/enquiries", response_model=EnquiryResponse, status_code=status.HTTP_201_CREATED)
async def create_enquiry(
    payload: EnquiryCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new prospective student enquiry assigned to the counselor.
    """
    user_email = current_user["id"].lower()

    # Resolve course title if course_id provided
    course_name = payload.course_name
    if payload.course_id and not course_name:
        course = await db.get(Course, payload.course_id)
        if course:
            course_name = course.title

    enquiry = Enquiry(
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        phone=payload.phone.strip() if payload.phone else None,
        course_id=payload.course_id,
        course_name=course_name,
        source=payload.source,
        status=payload.status,
        assigned_counselor_email=user_email,
        notes=payload.notes,
        next_follow_up_date=payload.next_follow_up_date,
    )
    db.add(enquiry)
    await db.flush()

    # Log initial interaction
    initial_log = InteractionLog(
        enquiry_id=enquiry.id,
        counselor_email=user_email,
        interaction_type="Note",
        summary="Enquiry created",
        details=f"Prospective student enquiry received via {payload.source} for {course_name or 'course'}.",
    )
    db.add(initial_log)

    # If follow-up date specified, automatically schedule task
    if payload.next_follow_up_date:
        due_dt = datetime.combine(payload.next_follow_up_date, datetime.min.time(), tzinfo=timezone.utc).replace(hour=10)
        task = CounselorTask(
            enquiry_id=enquiry.id,
            assigned_counselor_email=user_email,
            title=f"Follow-up: {enquiry.name}",
            description=f"Follow up on initial enquiry for {course_name or 'course'}.",
            due_datetime=due_dt,
            priority="Medium",
            status="Pending",
        )
        db.add(task)

    await db.commit()
    await db.refresh(enquiry)
    return enquiry


@router.get("/enquiries/{enquiry_id}", response_model=EnquiryDetailResponse)
async def get_enquiry_details(
    enquiry_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch comprehensive enquiry record with interaction history and follow-up tasks.
    """
    stmt = (
        select(Enquiry)
        .options(
            selectinload(Enquiry.follow_ups),
            selectinload(Enquiry.interactions),
        )
        .where(Enquiry.id == enquiry_id)
    )
    enquiry = (await db.execute(stmt)).scalars().first()
    if not enquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enquiry not found.")

    _verify_counselor_ownership(current_user, enquiry.assigned_counselor_email, "enquiry")

    follow_ups_data = [
        {
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "due_datetime": t.due_datetime.isoformat(),
            "priority": t.priority,
            "status": t.status,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None,
        }
        for t in enquiry.follow_ups
    ]

    interactions_data = [
        {
            "id": str(i.id),
            "interaction_type": i.interaction_type,
            "summary": i.summary,
            "details": i.details,
            "counselor_email": i.counselor_email,
            "created_at": i.created_at.isoformat(),
        }
        for i in enquiry.interactions
    ]

    base_dict = EnquiryResponse.model_validate(enquiry).model_dump()
    return EnquiryDetailResponse(
        **base_dict,
        follow_ups=follow_ups_data,
        interactions=interactions_data,
    )


@router.patch("/enquiries/{enquiry_id}", response_model=EnquiryResponse)
async def update_enquiry(
    enquiry_id: uuid.UUID,
    payload: EnquiryUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update permitted enquiry attributes, notes, status, and follow-up dates.
    """
    enquiry = await db.get(Enquiry, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enquiry not found.")

    _verify_counselor_ownership(current_user, enquiry.assigned_counselor_email, "enquiry")

    old_status = enquiry.status
    update_data = payload.model_dump(exclude_unset=True)

    for field, val in update_data.items():
        setattr(enquiry, field, val)

    # If status changed, record audit interaction log
    if payload.status and payload.status != old_status:
        db.add(
            InteractionLog(
                enquiry_id=enquiry.id,
                counselor_email=current_user["id"].lower(),
                interaction_type="Status Change",
                summary=f"Enquiry status updated to '{payload.status}'",
                details=f"Status transitioned from {old_status} to {payload.status}.",
            )
        )

    await db.commit()
    await db.refresh(enquiry)
    return enquiry


@router.post("/enquiries/{enquiry_id}/interactions", response_model=InteractionResponse)
async def record_enquiry_interaction(
    enquiry_id: uuid.UUID,
    payload: InteractionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Record contact attempt (call, email, meeting, note) and update last_contact_date.
    """
    enquiry = await db.get(Enquiry, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enquiry not found.")

    _verify_counselor_ownership(current_user, enquiry.assigned_counselor_email, "enquiry")

    log = InteractionLog(
        enquiry_id=enquiry.id,
        counselor_email=current_user["id"].lower(),
        interaction_type=payload.interaction_type,
        summary=payload.summary.strip(),
        details=payload.details.strip() if payload.details else None,
    )
    db.add(log)

    # Update last contact date
    enquiry.last_contact_date = date.today()
    if enquiry.status == "New" and payload.interaction_type.lower() in ["call", "email", "in-person meeting"]:
        enquiry.status = "Contacted"

    await db.commit()
    await db.refresh(log)
    return log


@router.post("/enquiries/{enquiry_id}/convert", response_model=AdmissionResponse)
async def convert_enquiry_to_admission(
    enquiry_id: uuid.UUID,
    payload: EnquiryConvertRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Convert an enquiry into an active Admission record. Prevents duplicate conversions.
    """
    enquiry = await db.get(Enquiry, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enquiry not found.")

    _verify_counselor_ownership(current_user, enquiry.assigned_counselor_email, "enquiry")

    # Strict check: Prevent duplicate conversion
    if enquiry.converted_to_admission_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This enquiry has already been converted to an admission.",
        )

    user_email = current_user["id"].lower()

    # Determine course
    course_id = payload.course_id or enquiry.course_id
    course_title = payload.course_title or enquiry.course_name
    if course_id and not course_title:
        c = await db.get(Course, course_id)
        if c:
            course_title = c.title
    if not course_title:
        course_title = "Standard Academic Programme"

    # Standard default documents checklist
    default_docs = payload.documents_required or [
        {"name": "Class 10th Certificate", "status": "Pending"},
        {"name": "Degree / Higher Secondary Marksheet", "status": "Pending"},
        {"name": "Government Photo ID Proof", "status": "Pending"},
    ]

    admission = Admission(
        enquiry_id=enquiry.id,
        student_name=enquiry.name,
        student_email=enquiry.email,
        student_phone=enquiry.phone,
        course_id=course_id,
        course_title=course_title,
        batch_id=payload.batch_id,
        assigned_counselor_email=user_email,
        stage="Application Started",
        application_date=date.today(),
        documents_required=default_docs,
        pending_requirements="Initial document submission pending from candidate.",
        last_activity="Enquiry converted to application.",
        next_action="Collect required identity and academic documents.",
        follow_up_due_date=date.today() + timedelta(days=2),
    )
    db.add(admission)
    await db.flush()

    # Update enquiry
    enquiry.status = "Converted"
    enquiry.converted_to_admission_id = admission.id
    enquiry.converted_at = datetime.now(timezone.utc)

    # Log interaction
    log = InteractionLog(
        enquiry_id=enquiry.id,
        admission_id=admission.id,
        counselor_email=user_email,
        interaction_type="Status Change",
        summary="Enquiry converted to formal admission application",
        details=f"Application initialized for {course_title}. Candidate onboarding begun.",
    )
    db.add(log)

    # Create follow-up task for document collection
    task = CounselorTask(
        admission_id=admission.id,
        assigned_counselor_email=user_email,
        title=f"Collect Documents - {admission.student_name}",
        description=f"Follow up regarding pending marksheets and ID proof for {course_title}.",
        due_datetime=datetime.now(timezone.utc) + timedelta(days=2),
        priority="High",
        status="Pending",
    )
    db.add(task)

    await db.commit()
    await db.refresh(admission)
    return admission


# ===========================================================================
# 3. My Students Directory
# ===========================================================================

@router.get("/students", response_model=Dict[str, Any])
async def list_counselor_students(
    search: Optional[str] = Query(None, description="Search student name, email, phone"),
    status: Optional[str] = Query(None, description="Enrolled, Active, Completed"),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List only students assigned to the authenticated counselor.
    """
    user_email = current_user["id"].lower()
    stmt = (
        select(Student)
        .options(
            selectinload(Student.enrollments).selectinload(BatchEnrollment.batch).selectinload(Batch.course),
        )
    )

    if not _is_admin(current_user):
        stmt = stmt.where(func.lower(Student.assigned_counselor_email) == user_email)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Student.name).like(term),
                func.lower(Student.email).like(term),
                func.lower(Student.phone).like(term),
            )
        )

    if status and status.strip():
        stmt = stmt.where(Student.status == status.strip())

    stmt = stmt.order_by(Student.created_at.desc())

    # Total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_count = (await db.execute(count_stmt)).scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    students = (await db.execute(stmt)).scalars().all()

    student_items = []
    for s in students:
        enrolled_courses = [
            e.batch.course.title
            for e in s.enrollments
            if e.batch and e.batch.course
        ]
        student_items.append(
            CounselorStudentResponse(
                id=s.id,
                name=s.name,
                email=s.email,
                phone=s.phone,
                status=s.status.value if hasattr(s.status, "value") else str(s.status),
                assigned_counselor_email=s.assigned_counselor_email,
                notes=s.notes,
                enrolled_courses=enrolled_courses,
                admission_stage="Enrolled" if enrolled_courses else "Student Account",
                created_at=s.created_at,
            )
        )

    return {
        "items": student_items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total_count + page_size - 1) // page_size),
    }


@router.get("/students/{student_id}", response_model=Dict[str, Any])
async def get_counselor_student_detail(
    student_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Student detail view showing admission stage, enrolled batches, follow-ups, and notes.
    """
    stmt = (
        select(Student)
        .options(
            selectinload(Student.enrollments).selectinload(BatchEnrollment.batch).selectinload(Batch.course),
            selectinload(Student.fee_installments),
        )
        .where(Student.id == student_id)
    )
    student = (await db.execute(stmt)).scalars().first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found.")

    if not _is_admin(current_user) and student.assigned_counselor_email:
        _verify_counselor_ownership(current_user, student.assigned_counselor_email, "student")

    # Fetch linked admissions
    adm_stmt = select(Admission).where(Admission.student_id == student.id)
    admissions = (await db.execute(adm_stmt)).scalars().all()

    # Fetch follow-up tasks
    task_stmt = select(CounselorTask).where(CounselorTask.student_id == student.id).order_by(CounselorTask.due_datetime.desc())
    tasks = (await db.execute(task_stmt)).scalars().all()

    # Fetch interaction history
    int_stmt = select(InteractionLog).where(InteractionLog.student_id == student.id).order_by(InteractionLog.created_at.desc())
    interactions = (await db.execute(int_stmt)).scalars().all()

    return {
        "student": {
            "id": str(student.id),
            "name": student.name,
            "email": student.email,
            "phone": student.phone,
            "status": student.status.value if hasattr(student.status, "value") else str(student.status),
            "assigned_counselor_email": student.assigned_counselor_email,
            "notes": student.notes,
            "created_at": student.created_at.isoformat(),
        },
        "enrollments": [
            {
                "batch_id": str(e.batch_id),
                "batch_code": e.batch.code if e.batch else "—",
                "course_title": e.batch.course.title if e.batch and e.batch.course else "—",
                "status": e.status.value if hasattr(e.status, "value") else str(e.status),
                "enrolled_on": e.enrolled_on.isoformat(),
            }
            for e in student.enrollments
        ],
        "admissions": [
            {
                "id": str(a.id),
                "course_title": a.course_title,
                "stage": a.stage,
                "pending_requirements": a.pending_requirements,
                "application_date": a.application_date.isoformat(),
                "documents_required": a.documents_required,
            }
            for a in admissions
        ],
        "follow_ups": [
            {
                "id": str(t.id),
                "title": t.title,
                "due_datetime": t.due_datetime.isoformat(),
                "priority": t.priority,
                "status": t.status,
            }
            for t in tasks
        ],
        "interactions": [
            {
                "id": str(i.id),
                "interaction_type": i.interaction_type,
                "summary": i.summary,
                "created_at": i.created_at.isoformat(),
            }
            for i in interactions
        ],
    }


# ===========================================================================
# 4. Follow-ups & Reminders
# ===========================================================================

@router.get("/follow-ups", response_model=Dict[str, Any])
async def list_follow_ups(
    view: str = Query("all", description="due_today, upcoming, overdue, completed, all"),
    priority: Optional[str] = Query(None, description="Low, Medium, High, Urgent"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List follow-up tasks assigned to the counselor categorized by schedule status.
    """
    user_email = current_user["id"].lower()
    now = datetime.now(timezone.utc)
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_today = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    stmt = select(CounselorTask).options(
        selectinload(CounselorTask.enquiry),
        selectinload(CounselorTask.admission),
    )

    if not _is_admin(current_user):
        stmt = stmt.where(func.lower(CounselorTask.assigned_counselor_email) == user_email)

    if view == "due_today":
        stmt = stmt.where(
            and_(
                CounselorTask.status == "Pending",
                CounselorTask.due_datetime >= start_of_today,
                CounselorTask.due_datetime <= end_of_today,
            )
        )
    elif view == "upcoming":
        stmt = stmt.where(
            and_(
                CounselorTask.status == "Pending",
                CounselorTask.due_datetime > end_of_today,
            )
        )
    elif view == "overdue":
        stmt = stmt.where(
            and_(
                CounselorTask.status == "Pending",
                CounselorTask.due_datetime < start_of_today,
            )
        )
    elif view == "completed":
        stmt = stmt.where(CounselorTask.status == "Completed")

    if priority and priority.strip():
        stmt = stmt.where(CounselorTask.priority == priority.strip())

    # Order
    if view == "overdue":
        stmt = stmt.order_by(CounselorTask.due_datetime.asc())
    elif view == "completed":
        stmt = stmt.order_by(CounselorTask.completed_at.desc().nulls_last())
    else:
        stmt = stmt.order_by(CounselorTask.due_datetime.asc())

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_count = (await db.execute(count_stmt)).scalar() or 0

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    tasks = (await db.execute(stmt)).scalars().all()

    items = []
    for t in tasks:
        associated_name = None
        associated_type = None
        if t.enquiry:
            associated_name = t.enquiry.name
            associated_type = "enquiry"
        elif t.admission:
            associated_name = t.admission.student_name
            associated_type = "admission"

        item = TaskResponse.model_validate(t)
        item.associated_name = associated_name
        item.associated_type = associated_type
        items.append(item)

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total_count + page_size - 1) // page_size),
    }


@router.post("/follow-ups", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_follow_up(
    payload: TaskCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new follow-up task with duplicate submission prevention.
    """
    user_email = current_user["id"].lower()

    # Prevent accidental duplicate task creation in short window
    duplicate_check = await db.execute(
        select(CounselorTask).where(
            and_(
                func.lower(CounselorTask.assigned_counselor_email) == user_email,
                CounselorTask.title == payload.title.strip(),
                CounselorTask.status == "Pending",
                CounselorTask.due_datetime == payload.due_datetime,
            )
        )
    )
    if duplicate_check.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A pending task with this title and due time already exists.",
        )

    # Verify entity ownership if provided
    if payload.enquiry_id:
        enq = await db.get(Enquiry, payload.enquiry_id)
        if enq:
            _verify_counselor_ownership(current_user, enq.assigned_counselor_email, "enquiry")
    if payload.admission_id:
        adm = await db.get(Admission, payload.admission_id)
        if adm:
            _verify_counselor_ownership(current_user, adm.assigned_counselor_email, "admission")

    task = CounselorTask(
        enquiry_id=payload.enquiry_id,
        student_id=payload.student_id,
        admission_id=payload.admission_id,
        assigned_counselor_email=user_email,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        due_datetime=payload.due_datetime,
        priority=payload.priority,
        status="Pending",
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.patch("/follow-ups/{task_id}", response_model=TaskResponse)
async def update_follow_up(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Edit permitted task fields.
    """
    task = await db.get(CounselorTask, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up task not found.")

    _verify_counselor_ownership(current_user, task.assigned_counselor_email, "task")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(task, field, val)

    if payload.status == "Completed" and not task.completed_at:
        task.completed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(task)
    return task


@router.post("/follow-ups/{task_id}/complete", response_model=TaskResponse)
async def complete_follow_up(
    task_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a task as completed with audit logging.
    """
    task = await db.get(CounselorTask, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up task not found.")

    _verify_counselor_ownership(current_user, task.assigned_counselor_email, "task")

    task.status = "Completed"
    task.completed_at = datetime.now(timezone.utc)

    # Log interaction
    log = InteractionLog(
        enquiry_id=task.enquiry_id,
        admission_id=task.admission_id,
        student_id=task.student_id,
        counselor_email=current_user["id"].lower(),
        interaction_type="Note",
        summary=f"Task completed: {task.title}",
        details=task.description,
    )
    db.add(log)

    await db.commit()
    await db.refresh(task)
    return task


@router.post("/follow-ups/{task_id}/reschedule", response_model=TaskResponse)
async def reschedule_follow_up(
    task_id: uuid.UUID,
    payload: TaskRescheduleRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Reschedule task to a new date and time, preserving history via rescheduled_from_id.
    """
    task = await db.get(CounselorTask, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up task not found.")

    _verify_counselor_ownership(current_user, task.assigned_counselor_email, "task")

    # Mark old task as rescheduled
    task.status = "Rescheduled"

    # Create new task
    new_task = CounselorTask(
        enquiry_id=task.enquiry_id,
        student_id=task.student_id,
        admission_id=task.admission_id,
        assigned_counselor_email=task.assigned_counselor_email,
        title=task.title,
        description=f"Rescheduled: {payload.reason}" if payload.reason else task.description,
        due_datetime=payload.new_due_datetime,
        priority=task.priority,
        status="Pending",
        rescheduled_from_id=task.id,
    )
    db.add(new_task)

    # Log interaction
    log = InteractionLog(
        enquiry_id=task.enquiry_id,
        admission_id=task.admission_id,
        student_id=task.student_id,
        counselor_email=current_user["id"].lower(),
        interaction_type="Note",
        summary=f"Task rescheduled: {task.title}",
        details=f"Moved from {task.due_datetime.isoformat()} to {payload.new_due_datetime.isoformat()}. Reason: {payload.reason or 'Not specified'}",
    )
    db.add(log)

    await db.commit()
    await db.refresh(new_task)
    return new_task


# ===========================================================================
# 5. Admission Pipeline & Actions
# ===========================================================================

@router.get("/admissions", response_model=Dict[str, Any])
async def list_counselor_admissions(
    stage: Optional[str] = Query(None, description="Filter by admission stage"),
    search: Optional[str] = Query(None, description="Search student name, email, phone, course"),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List admissions in the counselor's pipeline.
    """
    user_email = current_user["id"].lower()
    stmt = select(Admission)

    if not _is_admin(current_user):
        stmt = stmt.where(func.lower(Admission.assigned_counselor_email) == user_email)

    if stage and stage.strip():
        stmt = stmt.where(Admission.stage == stage.strip())

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Admission.student_name).like(term),
                func.lower(Admission.student_email).like(term),
                func.lower(Admission.course_title).like(term),
            )
        )

    stmt = stmt.order_by(Admission.application_date.desc(), Admission.created_at.desc())

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_count = (await db.execute(count_stmt)).scalar() or 0

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    admissions = (await db.execute(stmt)).scalars().all()

    return {
        "items": [AdmissionResponse.model_validate(a) for a in admissions],
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total_count + page_size - 1) // page_size),
    }


@router.get("/admissions/{admission_id}", response_model=AdmissionDetailResponse)
async def get_admission_detail(
    admission_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Admission application detail view with document checklist and approval request status.
    """
    stmt = (
        select(Admission)
        .options(
            selectinload(Admission.follow_ups),
            selectinload(Admission.interactions),
            selectinload(Admission.approval_request),
        )
        .where(Admission.id == admission_id)
    )
    admission = (await db.execute(stmt)).scalars().first()
    if not admission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission application not found.")

    _verify_counselor_ownership(current_user, admission.assigned_counselor_email, "admission application")

    follow_ups_data = [
        {
            "id": str(t.id),
            "title": t.title,
            "due_datetime": t.due_datetime.isoformat(),
            "priority": t.priority,
            "status": t.status,
        }
        for t in admission.follow_ups
    ]
    interactions_data = [
        {
            "id": str(i.id),
            "interaction_type": i.interaction_type,
            "summary": i.summary,
            "details": i.details,
            "created_at": i.created_at.isoformat(),
        }
        for i in admission.interactions
    ]
    base_dict = AdmissionResponse.model_validate(admission).model_dump()
    return AdmissionDetailResponse(
        **base_dict,
        follow_ups=follow_ups_data,
        interactions=interactions_data,
        approval_status=admission.approval_request.status if admission.approval_request else None,
    )


@router.patch("/admissions/{admission_id}", response_model=AdmissionResponse)
async def update_admission(
    admission_id: uuid.UUID,
    payload: AdmissionUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update admission stage, document checklist, and next actions.
    Enforces that counselors cannot directly mark 'Admission Approved' or 'Enrolled' without administrator sign-off.
    """
    admission = await db.get(Admission, admission_id)
    if not admission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission record not found.")

    _verify_counselor_ownership(current_user, admission.assigned_counselor_email, "admission application")

    stage_to_apply = payload.stage or payload.current_stage

    # Enforce approval restriction
    if stage_to_apply in ["Admission Approved", "Enrolled"] and not _is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Counselors cannot directly mark an admission as Approved or Enrolled without Administrator authorization. "
                "Please submit an official Approval Request to the Administrator."
            ),
        )

    old_stage = admission.stage
    update_data = payload.model_dump(exclude_unset=True)
    if "current_stage" in update_data:
        update_data["stage"] = update_data.pop("current_stage")
    notes_val = update_data.pop("notes", None)

    for field, val in update_data.items():
        if hasattr(admission, field) and val is not None:
            setattr(admission, field, val)

    if stage_to_apply and stage_to_apply != old_stage:
        admission.stage = stage_to_apply
        db.add(
            InteractionLog(
                admission_id=admission.id,
                counselor_email=current_user["id"].lower(),
                interaction_type="Status Change",
                summary=f"Admission stage updated to '{stage_to_apply}'",
                details=notes_val or f"Stage transitioned from {old_stage} to {stage_to_apply}.",
            )
        )
    elif notes_val:
        db.add(
            InteractionLog(
                admission_id=admission.id,
                counselor_email=current_user["id"].lower(),
                interaction_type="Note",
                summary="Counselor note recorded",
                details=notes_val,
            )
        )

    await db.commit()
    await db.refresh(admission)
    return admission


@router.post("/admissions/{admission_id}/submit-approval", response_model=Dict[str, Any])
async def submit_admission_for_approval(
    admission_id: uuid.UUID,
    payload: SubmitApprovalRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submits an official ApprovalRequest to the Administrator for candidate enrollment.
    """
    admission = await db.get(Admission, admission_id)
    if not admission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission record not found.")

    _verify_counselor_ownership(current_user, admission.assigned_counselor_email, "admission application")

    # Check for existing pending approval request
    if admission.approval_request_id:
        existing_req = await db.get(ApprovalRequest, admission.approval_request_id)
        if existing_req and existing_req.status == "Pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An approval request is already pending for this admission application.",
            )

    user_email = current_user["id"].lower()
    counselor_name = current_user.get("name", "Admissions Counselor")

    # Create formal ApprovalRequest in the existing approval pipeline
    approval_req = ApprovalRequest(
        request_type="Admission Approval",
        title=f"Admission Approval: {admission.student_name} ({admission.course_title})",
        description=(
            f"Admissions counselor {user_email} has verified candidate credentials and submitted "
            f"{admission.student_name} for enrollment authorization. Notes: {payload.notes or 'None'}"
        ),
        requester_name=counselor_name,
        requester_email=user_email,
        requester_role="counselor",
        status="Pending",
        payload={
            "admission_id": str(admission.id),
            "student_name": admission.student_name,
            "student_email": admission.student_email,
            "student_phone": admission.student_phone,
            "course_title": admission.course_title,
            "batch_id": str(admission.batch_id) if admission.batch_id else None,
        },
    )
    db.add(approval_req)
    await db.flush()

    # Update admission status
    admission.approval_request_id = approval_req.id
    admission.stage = "Documents Under Review"
    admission.last_activity = "Submitted for Administrator Approval"
    admission.next_action = "Awaiting Administrator Decision"

    # Log interaction
    log = InteractionLog(
        admission_id=admission.id,
        counselor_email=user_email,
        interaction_type="Status Change",
        summary="Submitted for Administrator Approval",
        details=f"Approval request #{approval_req.id} created for executive review.",
    )
    db.add(log)

    await db.commit()
    await db.refresh(admission)

    return {
        "message": "Admission application successfully submitted to Administrator for approval.",
        "admission_id": str(admission.id),
        "approval_request_id": str(approval_req.id),
        "stage": admission.stage,
    }


# ===========================================================================
# 6. Next Actions Endpoint
# ===========================================================================

@router.get("/next-actions", response_model=List[Dict[str, Any]])
async def get_counselor_next_actions(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns prioritized operational next actions derived from real backend dates and statuses.
    """
    user_email = current_user["id"].lower()
    is_admin_user = _is_admin(current_user)
    now = datetime.now(timezone.utc)
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_today = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    actions = []

    # 1. Overdue Tasks
    task_filter = True if is_admin_user else func.lower(CounselorTask.assigned_counselor_email) == user_email
    overdue_tasks = (
        await db.execute(
            select(CounselorTask)
            .where(
                and_(
                    task_filter,
                    CounselorTask.status == "Pending",
                    CounselorTask.due_datetime < start_of_today,
                )
            )
            .order_by(CounselorTask.due_datetime.asc())
            .limit(4)
        )
    ).scalars().all()

    for ot in overdue_tasks:
        actions.append({
            "id": f"task-overdue-{ot.id}",
            "type": "overdue_task",
            "priority": "Urgent",
            "title": ot.title,
            "description": f"Overdue task: {ot.description or 'No notes'}",
            "due": ot.due_datetime.strftime("%d %b %H:%M"),
            "target_tab": "followups",
        })

    # 2. Tasks Due Today
    today_tasks = (
        await db.execute(
            select(CounselorTask)
            .where(
                and_(
                    task_filter,
                    CounselorTask.status == "Pending",
                    CounselorTask.due_datetime >= start_of_today,
                    CounselorTask.due_datetime <= end_of_today,
                )
            )
            .order_by(CounselorTask.due_datetime.asc())
            .limit(4)
        )
    ).scalars().all()

    for tt in today_tasks:
        actions.append({
            "id": f"task-today-{tt.id}",
            "type": "today_task",
            "priority": "High" if tt.priority in ["High", "Urgent"] else "Medium",
            "title": tt.title,
            "description": f"Due today at {tt.due_datetime.strftime('%H:%M')}",
            "due": "Today",
            "target_tab": "followups",
        })

    # 3. New Enquiries Not Yet Contacted
    enq_filter = True if is_admin_user else func.lower(Enquiry.assigned_counselor_email) == user_email
    new_enqs = (
        await db.execute(
            select(Enquiry)
            .where(and_(enq_filter, Enquiry.status == "New"))
            .order_by(Enquiry.created_at.asc())
            .limit(3)
        )
    ).scalars().all()

    for ne in new_enqs:
        actions.append({
            "id": f"enq-new-{ne.id}",
            "type": "new_enquiry",
            "priority": "High",
            "title": f"Initial outreach: {ne.name}",
            "description": f"Enquiry received via {ne.source} for {ne.course_name or 'course'}.",
            "due": "Immediate",
            "target_tab": "enquiries",
        })

    # 4. Admissions Awaiting Document Submission
    adm_filter = True if is_admin_user else func.lower(Admission.assigned_counselor_email) == user_email
    docs_pending = (
        await db.execute(
            select(Admission)
            .where(and_(adm_filter, Admission.stage == "Documents Pending"))
            .order_by(Admission.follow_up_due_date.asc().nulls_last())
            .limit(3)
        )
    ).scalars().all()

    for dp in docs_pending:
        actions.append({
            "id": f"adm-docs-{dp.id}",
            "type": "pending_documents",
            "priority": "Medium",
            "title": f"Request Documents: {dp.student_name}",
            "description": dp.pending_requirements or "Candidate has missing documents.",
            "due": dp.follow_up_due_date.strftime("%d %b") if dp.follow_up_due_date else "Pending",
            "target_tab": "admissions",
        })

    return actions
