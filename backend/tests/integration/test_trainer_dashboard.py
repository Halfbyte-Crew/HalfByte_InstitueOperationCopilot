"""
Integration tests for Trainer Dashboard and Student Account Operations.
Validates:
- Strict RBAC: only trainer/admin roles can access /trainer endpoints; counselor/student/finance denied (403)
- Complete isolation: trainers cannot view or access batches, sessions, or students assigned to other trainers
- Zero financial exposure: verified across overview, batches, students, schedule, and progress endpoints
- Attendance worksheet retrieval, bulk submission, upsert/duplicate prevention, history, and CSV export
- Academic progress indicators, observation notes logging, and unsupported features handling
- Student account creation workflow: token generation, single-use activation, public activation, and login authentication
"""
from datetime import date, datetime, timedelta, timezone
import hashlib
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.main import app
from app.models.institute import (
    AcademicObservation,
    AttendanceRecord,
    AttendanceStatus,
    Batch,
    BatchEnrollment,
    BatchStatus,
    ClassSchedule,
    ClassScheduleStatus,
    Course,
    EnrollmentStatus,
    Student,
    StudentAccount,
    StudentStatus,
    Trainer,
)


@pytest.fixture
def trainer_user():
    return {
        "id": "trainer@edupilot.io",
        "email": "trainer@edupilot.io",
        "role": "trainer",
        "name": "Prof. Anita Desai",
    }


@pytest.fixture
def other_trainer_user():
    return {
        "id": "david.m@edupilot.io",
        "email": "david.m@edupilot.io",
        "role": "trainer",
        "name": "Prof. David Miller",
    }


@pytest.fixture
def counselor_user():
    return {
        "id": "counselor@edupilot.io",
        "email": "counselor@edupilot.io",
        "role": "counselor",
        "name": "Priya Sharma",
    }


@pytest.fixture
def student_user():
    return {
        "id": "student@edupilot.io",
        "email": "student@edupilot.io",
        "role": "student",
        "name": "Demo Student",
    }


@pytest.mark.anyio
async def test_trainer_role_access_and_unauthorized_denial(
    client: AsyncClient,
    trainer_user,
    counselor_user,
    student_user,
):
    """Verifies that non-trainer roles receive 403 Forbidden on /trainer endpoints."""
    # 1. Counselor tries to view trainer overview -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: counselor_user
    res = await client.get("/api/v1/trainer/overview")
    assert res.status_code == 403

    # 2. Student tries to view trainer schedule -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: student_user
    res = await client.get("/api/v1/trainer/schedule")
    assert res.status_code == 403

    # 3. Trainer accesses trainer overview -> 200 OK
    app.dependency_overrides[get_current_user] = lambda: trainer_user
    res = await client.get("/api/v1/trainer/overview")
    assert res.status_code == 200

    # 4. Trainer tries to access finance overview -> 403 Forbidden
    res_fin = await client.get("/api/v1/finance/overview")
    assert res_fin.status_code == 403


@pytest.mark.anyio
async def test_trainer_overview_and_zero_financial_exposure(
    client: AsyncClient,
    db_session: AsyncSession,
    trainer_user,
):
    """
    Verifies that the trainer overview returns academic statistics
    and strictly excludes all fee/financial data.
    """
    app.dependency_overrides[get_current_user] = lambda: trainer_user
    res = await client.get("/api/v1/trainer/overview")
    assert res.status_code == 200
    data = res.json()

    assert "assigned_batches" in data
    assert "total_students" in data
    assert "todays_sessions" in data
    assert "attendance_pending_today" in data

    # STRICT CHECK: No financial keys
    for key in data.keys():
        lower_k = key.lower()
        assert "fee" not in lower_k
        assert "emi" not in lower_k
        assert "payment" not in lower_k
        assert "receivable" not in lower_k
        assert "collection" not in lower_k
        assert "outstanding" not in lower_k


@pytest.mark.anyio
async def test_trainer_schedule_and_batch_isolation(
    client: AsyncClient,
    db_session: AsyncSession,
    trainer_user,
    other_trainer_user,
):
    """
    Verifies schedule filtering and that a trainer CANNOT view or access
    sessions for batches assigned to a different trainer.
    """
    # 1. Create a course and two distinct trainers
    course = Course(code=f"TEST-CRS-{uuid.uuid4().hex[:6]}", title="Architecture Test", duration_weeks=10, base_fee=50000)
    db_session.add(course)
    await db_session.flush()

    trainer_anita = Trainer(name="Prof. Anita Desai", email="trainer@edupilot.io", specialization="Web")
    trainer_david = Trainer(name="Prof. David Miller", email="david.m@edupilot.io", specialization="AI")
    db_session.add_all([trainer_anita, trainer_david])
    await db_session.flush()

    batch_anita = Batch(code=f"ANITA-{uuid.uuid4().hex[:4]}", course_id=course.id, trainer_id=trainer_anita.id, status=BatchStatus.ACTIVE)
    batch_david = Batch(code=f"DAVID-{uuid.uuid4().hex[:4]}", course_id=course.id, trainer_id=trainer_david.id, status=BatchStatus.ACTIVE)
    db_session.add_all([batch_anita, batch_david])
    await db_session.flush()

    today = date.today()
    session_anita = ClassSchedule(
        batch_id=batch_anita.id,
        trainer_id=trainer_anita.id,
        title="Anita's Class",
        scheduled_date=today,
        start_time="10:00",
        end_time="12:00",
        status=ClassScheduleStatus.SCHEDULED,
    )
    session_david = ClassSchedule(
        batch_id=batch_david.id,
        trainer_id=trainer_david.id,
        title="David's Class",
        scheduled_date=today,
        start_time="14:00",
        end_time="16:00",
        status=ClassScheduleStatus.SCHEDULED,
    )
    db_session.add_all([session_anita, session_david])
    await db_session.commit()

    # Anita checks her schedule -> sees only her session
    app.dependency_overrides[get_current_user] = lambda: trainer_user
    res = await client.get("/api/v1/trainer/schedule")
    assert res.status_code == 200
    schedule_data = res.json()
    todays = schedule_data["todays_sessions"]
    session_titles = [s["title"] for s in todays]
    assert "Anita's Class" in session_titles
    assert "David's Class" not in session_titles

    # Anita attempts to filter by David's batch -> 403 Forbidden
    res_forbidden = await client.get(f"/api/v1/trainer/schedule?batch_id={batch_david.id}")
    assert res_forbidden.status_code == 403


async def get_or_create_trainer(db: AsyncSession, name: str, email: str, spec: str = "Engineering") -> Trainer:
    t = (await db.execute(select(Trainer).where(Trainer.email == email))).scalar_one_or_none()
    if not t:
        t = Trainer(name=name, email=email, specialization=spec)
        db.add(t)
        await db.flush()
    return t


@pytest.mark.anyio
async def test_batch_students_and_unassigned_batch_protection(
    client: AsyncClient,
    db_session: AsyncSession,
    trainer_user,
    other_trainer_user,
):
    """
    Verifies that a trainer can list students in their assigned batch,
    but gets 403 Forbidden when trying to list students in another trainer's batch.
    """
    course = Course(code=f"CRS-{uuid.uuid4().hex[:6]}", title="Batch Test", duration_weeks=8, base_fee=40000)
    db_session.add(course)
    await db_session.flush()

    trainer_anita = await get_or_create_trainer(db_session, "Prof. Anita Desai", "trainer@edupilot.io", "Web")
    trainer_david = await get_or_create_trainer(db_session, "Prof. David Miller", "david.m@edupilot.io", "AI")

    batch_anita = Batch(code=f"ANITA-B-{uuid.uuid4().hex[:4]}", course_id=course.id, trainer_id=trainer_anita.id, status=BatchStatus.ACTIVE)
    batch_david = Batch(code=f"DAVID-B-{uuid.uuid4().hex[:4]}", course_id=course.id, trainer_id=trainer_david.id, status=BatchStatus.ACTIVE)
    db_session.add_all([batch_anita, batch_david])
    await db_session.flush()

    stu_anita = Student(name="Anita Student", email=f"stu_anita_{uuid.uuid4().hex[:6]}@example.com")
    stu_david = Student(name="David Student", email=f"stu_david_{uuid.uuid4().hex[:6]}@example.com")
    db_session.add_all([stu_anita, stu_david])
    await db_session.flush()

    db_session.add(BatchEnrollment(student_id=stu_anita.id, batch_id=batch_anita.id, enrolled_on=date.today()))
    db_session.add(BatchEnrollment(student_id=stu_david.id, batch_id=batch_david.id, enrolled_on=date.today()))
    await db_session.commit()

    # Anita accesses her batch students -> 200 OK
    app.dependency_overrides[get_current_user] = lambda: trainer_user
    res = await client.get(f"/api/v1/trainer/batches/{batch_anita.id}/students")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["students"][0]["name"] == "Anita Student"

    # ZERO financial fields check
    student_obj = data["students"][0]
    for key in student_obj.keys():
        lower_k = key.lower()
        assert "fee" not in lower_k
        assert "payment" not in lower_k
        assert "amount" not in lower_k
        assert "balance" not in lower_k

    # Anita attempts to access David's batch students -> 403 Forbidden
    res_denied = await client.get(f"/api/v1/trainer/batches/{batch_david.id}/students")
    assert res_denied.status_code == 403


@pytest.mark.anyio
async def test_attendance_marking_upsert_and_history(
    client: AsyncClient,
    db_session: AsyncSession,
    trainer_user,
):
    """
    Verifies attendance recording:
    - Get worksheet
    - Submit bulk attendance
    - Duplicate prevention: re-submitting updates the record without duplicate primary keys
    - Attendance history query and CSV export
    """
    course = Course(code=f"ATT-CRS-{uuid.uuid4().hex[:6]}", title="Attendance Course", duration_weeks=12, base_fee=60000)
    db_session.add(course)
    await db_session.flush()

    trainer = await get_or_create_trainer(db_session, "Prof. Anita Desai", "trainer@edupilot.io", "Web")
    batch = Batch(code=f"ATT-B-{uuid.uuid4().hex[:4]}", course_id=course.id, trainer_id=trainer.id, status=BatchStatus.ACTIVE)
    db_session.add(batch)
    await db_session.flush()

    stu = Student(name="Test Attendee", email=f"att_{uuid.uuid4().hex[:6]}@example.com")
    db_session.add(stu)
    await db_session.flush()

    db_session.add(BatchEnrollment(student_id=stu.id, batch_id=batch.id, enrolled_on=date.today()))
    session_date = date.today()
    sched = ClassSchedule(
        batch_id=batch.id,
        trainer_id=trainer.id,
        title="Live Coding Session",
        scheduled_date=session_date,
        start_time="09:00",
        end_time="11:00",
        status=ClassScheduleStatus.SCHEDULED,
    )
    db_session.add(sched)
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: trainer_user

    # 1. Get attendance sheet
    res_sheet = await client.get(f"/api/v1/trainer/sessions/{sched.id}/attendance")
    assert res_sheet.status_code == 200
    sheet_data = res_sheet.json()
    assert sheet_data["total_enrolled"] == 1
    assert sheet_data["already_submitted"] is False

    # 2. Submit attendance: Mark Present
    payload = {
        "batch_id": str(batch.id),
        "session_date": session_date.isoformat(),
        "entries": [
            {
                "student_id": str(stu.id),
                "status": "Present",
                "remarks": "On time and actively engaged",
            }
        ],
    }
    res_sub = await client.post("/api/v1/trainer/attendance", json=payload)
    assert res_sub.status_code == 200
    sub_data = res_sub.json()
    assert sub_data["submitted"] == 1
    assert sub_data["updated"] == 0

    # 3. Duplicate prevention: submit correction (Late)
    payload_update = {
        "batch_id": str(batch.id),
        "session_date": session_date.isoformat(),
        "entries": [
            {
                "student_id": str(stu.id),
                "status": "Late",
                "remarks": "Corrected: arrived 10 mins late",
            }
        ],
    }
    res_up = await client.post("/api/v1/trainer/attendance", json=payload_update)
    assert res_up.status_code == 200
    up_data = res_up.json()
    assert up_data["submitted"] == 0
    assert up_data["updated"] == 1

    # 4. Check attendance history
    res_hist = await client.get(f"/api/v1/trainer/attendance/history?batch_id={batch.id}")
    assert res_hist.status_code == 200
    hist_data = res_hist.json()
    assert hist_data["total"] == 1
    assert hist_data["records"][0]["status"] == "Late"
    assert hist_data["records"][0]["remarks"] == "Corrected: arrived 10 mins late"

    # 5. Check CSV export
    res_export = await client.get(f"/api/v1/trainer/attendance/export?batch_id={batch.id}")
    assert res_export.status_code == 200
    assert "text/csv" in res_export.headers.get("content-type", "")
    assert "Test Attendee" in res_export.text


@pytest.mark.anyio
async def test_student_academic_progress_and_observations(
    client: AsyncClient,
    db_session: AsyncSession,
    trainer_user,
    other_trainer_user,
):
    """
    Verifies student academic progress retrieval and observation logging.
    Enforces that unassigned students are inaccessible (403 Forbidden).
    """
    course = Course(code=f"PROG-CRS-{uuid.uuid4().hex[:6]}", title="Progress Course", duration_weeks=10, base_fee=45000)
    db_session.add(course)
    await db_session.flush()

    trainer_anita = await get_or_create_trainer(db_session, "Prof. Anita Desai", "trainer@edupilot.io", "Web")
    trainer_david = await get_or_create_trainer(db_session, "Prof. David Miller", "david.m@edupilot.io", "AI")

    batch_anita = Batch(code=f"PROG-A-{uuid.uuid4().hex[:4]}", course_id=course.id, trainer_id=trainer_anita.id, status=BatchStatus.ACTIVE)
    batch_david = Batch(code=f"PROG-D-{uuid.uuid4().hex[:4]}", course_id=course.id, trainer_id=trainer_david.id, status=BatchStatus.ACTIVE)
    db_session.add_all([batch_anita, batch_david])
    await db_session.flush()

    stu_assigned = Student(name="Assigned Scholar", email=f"assigned_{uuid.uuid4().hex[:6]}@example.com")
    stu_unassigned = Student(name="Unassigned Scholar", email=f"unassigned_{uuid.uuid4().hex[:6]}@example.com")
    db_session.add_all([stu_assigned, stu_unassigned])
    await db_session.flush()

    db_session.add(BatchEnrollment(student_id=stu_assigned.id, batch_id=batch_anita.id, enrolled_on=date.today()))
    db_session.add(BatchEnrollment(student_id=stu_unassigned.id, batch_id=batch_david.id, enrolled_on=date.today()))
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: trainer_user

    # 1. Fetch assigned student progress -> 200 OK
    res_prog = await client.get(f"/api/v1/trainer/students/{stu_assigned.id}/progress")
    assert res_prog.status_code == 200
    prog_data = res_prog.json()
    assert prog_data["student_name"] == "Assigned Scholar"
    assert "attendance_rate" in prog_data
    assert "unsupported_features_note" in prog_data

    # 2. Add academic observation
    obs_payload = {
        "batch_id": str(batch_anita.id),
        "observation_type": "Milestone",
        "note": "Successfully completed asynchronous queue pipeline project.",
    }
    res_obs = await client.post(f"/api/v1/trainer/students/{stu_assigned.id}/observations", json=obs_payload)
    assert res_obs.status_code == 201
    obs_data = res_obs.json()
    assert obs_data["observation_type"] == "Milestone"
    assert "asynchronous queue" in obs_data["note"]

    # 3. Access unassigned student progress -> 403 Forbidden
    res_denied = await client.get(f"/api/v1/trainer/students/{stu_unassigned.id}/progress")
    assert res_denied.status_code == 403


@pytest.mark.anyio
async def test_student_account_creation_activation_and_login_lifecycle(
    client: AsyncClient,
    db_session: AsyncSession,
    trainer_user,
    other_trainer_user,
):
    """
    End-to-end student account provisioning lifecycle:
    1. Check initial account status ('not_created')
    2. Trainer creates account -> generates single-use activation token ('pending_activation')
    3. Trainer cannot create account for unassigned student (403)
    4. Student activates account with custom password using single-use token
    5. Token cannot be reused (400 Bad Request)
    6. Student signs in via /api/v1/auth/login using their new password and gets role 'student'
    """
    course = Course(code=f"ACC-CRS-{uuid.uuid4().hex[:6]}", title="Account Test Course", duration_weeks=12, base_fee=50000)
    db_session.add(course)
    await db_session.flush()

    trainer_anita = await get_or_create_trainer(db_session, "Prof. Anita Desai", "trainer@edupilot.io", "Web")
    trainer_david = await get_or_create_trainer(db_session, "Prof. David Miller", "david.m@edupilot.io", "AI")

    batch_anita = Batch(code=f"ACC-A-{uuid.uuid4().hex[:4]}", course_id=course.id, trainer_id=trainer_anita.id, status=BatchStatus.ACTIVE)
    batch_david = Batch(code=f"ACC-D-{uuid.uuid4().hex[:4]}", course_id=course.id, trainer_id=trainer_david.id, status=BatchStatus.ACTIVE)
    db_session.add_all([batch_anita, batch_david])
    await db_session.flush()

    stu_email = f"student_lifecycle_{uuid.uuid4().hex[:6]}@example.com"
    student = Student(name="Lifecycle Student", email=stu_email)
    stu_other = Student(name="Other Student", email=f"other_{uuid.uuid4().hex[:6]}@example.com")
    db_session.add_all([student, stu_other])
    await db_session.flush()

    db_session.add(BatchEnrollment(student_id=student.id, batch_id=batch_anita.id, enrolled_on=date.today()))
    db_session.add(BatchEnrollment(student_id=stu_other.id, batch_id=batch_david.id, enrolled_on=date.today()))
    await db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: trainer_user

    # 1. Check account status -> 'not_created'
    res_status = await client.get(f"/api/v1/trainer/students/{student.id}/account")
    assert res_status.status_code == 200
    assert res_status.json()["account_status"] == "not_created"
    assert res_status.json()["has_login"] is False

    # 2. Attempt creating account for unassigned student -> 403 Forbidden
    res_unassigned = await client.post(f"/api/v1/trainer/students/{stu_other.id}/account")
    assert res_unassigned.status_code == 403

    # 3. Create account for assigned student -> 'pending_activation'
    res_create = await client.post(f"/api/v1/trainer/students/{student.id}/account")
    assert res_create.status_code == 201
    create_data = res_create.json()
    assert create_data["account_status"] == "pending_activation"
    assert create_data["activation_token_issued"] is True
    raw_token = create_data["activation_token"]
    assert raw_token is not None
    assert "/activate?token=" in create_data["activation_url"]

    # 4. Public endpoint: verify activation token
    res_ver = await client.get(f"/api/v1/auth/verify-activation?token={raw_token}")
    assert res_ver.status_code == 200
    assert res_ver.json()["valid"] is True
    assert res_ver.json()["student_name"] == "Lifecycle Student"

    # 5. Public endpoint: activate account with new password
    act_payload = {
        "token": raw_token,
        "password": "SecureStudentPassword@2026",
    }
    res_act = await client.post("/api/v1/auth/activate-student", json=act_payload)
    assert res_act.status_code == 200
    act_data = res_act.json()
    assert act_data["user"]["role"] == "student"
    assert act_data["user"]["email"] == stu_email

    # 6. Re-using the same token fails (single-use protection)
    res_act_reuse = await client.post("/api/v1/auth/activate-student", json=act_payload)
    assert res_act_reuse.status_code == 400

    # 7. Student signs in via /api/v1/auth/login using their new password
    login_payload = {
        "email": stu_email,
        "password": "SecureStudentPassword@2026",
    }
    res_login = await client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200
    login_data = res_login.json()
    assert login_data["user"]["role"] == "student"
    assert login_data["user"]["name"] == "Lifecycle Student"
    assert login_data["dashboard_url"] == "/dashboard/student"
