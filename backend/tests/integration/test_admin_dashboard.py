import pytest
from datetime import date, datetime, timezone
import uuid
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
from app.main import app
from app.api.dependencies import get_current_user


@pytest.mark.asyncio
async def test_admin_overview_and_conflicts(client, db_session):
    # Seed a course, batch, trainer
    course = Course(code="CS-101", title="Computer Science 101", duration_weeks=12, base_fee=1000)
    trainer = Trainer(name="Dr. Sarah", email="sarah@edupilot.io", specialization="Algorithms")
    student = Student(name="Alice", email="alice@edupilot.io", status=StudentStatus.ACTIVE)
    db_session.add_all([course, trainer, student])
    await db_session.commit()

    batch = Batch(code="CS-2026-A", course_id=course.id, trainer_id=trainer.id, status=BatchStatus.ACTIVE)
    db_session.add(batch)
    await db_session.commit()

    # Seed 2 overlapping sessions for Dr. Sarah on today's date
    s1 = ClassSchedule(
        batch_id=batch.id,
        trainer_id=trainer.id,
        title="Session 1",
        scheduled_date=date.today(),
        start_time="09:00",
        end_time="10:30",
        classroom="Lab 1",
        status=ClassScheduleStatus.SCHEDULED,
    )
    s2 = ClassSchedule(
        batch_id=batch.id,
        trainer_id=trainer.id,
        title="Session 2",
        scheduled_date=date.today(),
        start_time="10:00",
        end_time="11:30",
        classroom="Lab 2",
        status=ClassScheduleStatus.SCHEDULED,
    )
    # Seed 1 approval request
    approval = ApprovalRequest(
        request_type="BATCH_TRANSFER",
        title="Transfer Alice",
        description="Transfer request",
        requester_name="Priya",
        requester_email="priya@edupilot.io",
        requester_role="counselor",
        status="Pending",
    )
    db_session.add_all([s1, s2, approval])
    await db_session.commit()

    # 1. Test Admin Overview
    res = await client.get("/api/v1/dashboard/admin/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_students"] == 1
    assert data["total_batches"] == 1
    assert data["total_trainers"] == 1
    assert data["upcoming_classes"] == 2
    assert data["pending_approvals_count"] == 1
    assert data["active_conflicts_count"] == 1

    # 2. Test Conflicts Endpoint
    conflicts_res = await client.get("/api/v1/dashboard/admin/conflicts")
    assert conflicts_res.status_code == 200
    conflicts = conflicts_res.json()
    assert len(conflicts) == 1
    assert conflicts[0]["conflict_type"] == "TRAINER_OVERLAP"
    assert "Dr. Sarah" in conflicts[0]["title"]
    assert conflicts[0]["overlapping_time"] == "10:00 - 10:30"

    # 3. Test Alerts Endpoint
    alerts_res = await client.get("/api/v1/dashboard/admin/alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert any(a["title"].startswith("Faculty Overlap") for a in alerts)
    assert any("Pending Action Approvals" in a["title"] for a in alerts)
    assert any(a["is_ai_generated"] is True for a in alerts)

    # 4. Test Acknowledge Alert
    alert_to_ack = alerts[0]["id"]
    ack_res = await client.post(f"/api/v1/dashboard/admin/alerts/{alert_to_ack}/acknowledge")
    assert ack_res.status_code == 200

    # 5. Test Upcoming Classes
    classes_res = await client.get("/api/v1/dashboard/admin/upcoming-classes")
    assert classes_res.status_code == 200
    assert len(classes_res.json()) == 2


@pytest.mark.asyncio
async def test_staff_management(client, db_session):
    # Create staff
    staff_payload = {
        "name": "Jane Doe",
        "email": "jane.doe@edupilot.io",
        "role": "coordinator",
        "department": "Academics",
        "phone": "+1 555 1234",
    }
    create_res = await client.post("/api/v1/staff", json=staff_payload)
    assert create_res.status_code == 201
    staff_id = create_res.json()["id"]

    # List staff
    list_res = await client.get("/api/v1/staff?search=Jane")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # Update staff
    update_res = await client.patch(
        f"/api/v1/staff/{staff_id}",
        json={"department": "Senior Academics"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["department"] == "Senior Academics"

    # Toggle status
    toggle_res = await client.post(f"/api/v1/staff/{staff_id}/toggle-status")
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False


@pytest.mark.asyncio
async def test_approvals_workflow(client, db_session):
    # Submit request
    payload = {
        "request_type": "FEE_CONCESSION",
        "title": "Concession for Bob",
        "description": "50% concession",
        "requester_name": "Counselor Priya",
        "requester_email": "priya@edupilot.io",
        "requester_role": "counselor",
        "payload": {"amount": 500},
    }
    create_res = await client.post("/api/v1/approvals", json=payload)
    assert create_res.status_code == 201
    req_id = create_res.json()["id"]

    # Counts
    counts_res = await client.get("/api/v1/approvals/counts")
    assert counts_res.status_code == 200
    assert counts_res.json()["pending"] == 1

    # Approve request
    approve_res = await client.post(f"/api/v1/approvals/{req_id}/approve")
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "Approved"
    assert approve_res.json()["reviewed_by"] == "test-admin-uuid"

    # Cannot approve again
    dup_res = await client.post(f"/api/v1/approvals/{req_id}/approve")
    assert dup_res.status_code == 400


@pytest.mark.asyncio
async def test_role_enforcement_on_admin_routes(client):
    # Override user as 'trainer'
    async def override_trainer_user():
        return {"id": "trainer-id", "role": "trainer"}

    app.dependency_overrides[get_current_user] = override_trainer_user

    try:
        # Trainer should receive 403 on admin overview
        res1 = await client.get("/api/v1/dashboard/admin/overview")
        assert res1.status_code == 403

        # Trainer should receive 403 on staff management
        res2 = await client.get("/api/v1/staff")
        assert res2.status_code == 403
    finally:
        # Restore admin user
        async def override_admin_user():
            return {"id": "test-admin-uuid", "role": "super_admin"}

        app.dependency_overrides[get_current_user] = override_admin_user


@pytest.mark.asyncio
async def test_non_admin_dashboards_still_work(client, db_session):
    # Seed course and batch
    course = Course(code="PY-101", title="Python Pro", duration_weeks=8, base_fee=500)
    db_session.add(course)
    await db_session.commit()
    batch = Batch(code="PY-2026-X", course_id=course.id, status=BatchStatus.ACTIVE)
    db_session.add(batch)
    await db_session.commit()

    # 1. Counselor Dashboard
    async def override_counselor():
        return {"id": "counselor-1", "role": "counselor"}
    app.dependency_overrides[get_current_user] = override_counselor
    res_counselor = await client.get("/api/v1/dashboard/counselor/summary")
    assert res_counselor.status_code == 200

    # 2. Trainer Dashboard
    async def override_trainer():
        return {"id": "trainer-1", "role": "trainer"}
    app.dependency_overrides[get_current_user] = override_trainer
    res_trainer = await client.get("/api/v1/dashboard/trainer/schedule")
    assert res_trainer.status_code == 200
    assert "assigned_batches" in res_trainer.json()

    # 3. Accounts Dashboard
    async def override_finance():
        return {"id": "finance-1", "role": "finance"}
    app.dependency_overrides[get_current_user] = override_finance
    res_accounts = await client.get("/api/v1/dashboard/accounts/overview")
    assert res_accounts.status_code == 200

    # 4. Student Dashboard
    async def override_student():
        return {"id": "student-1", "role": "student"}
    app.dependency_overrides[get_current_user] = override_student
    res_student = await client.get("/api/v1/dashboard/student/profile")
    assert res_student.status_code == 200

    # Restore admin
    async def override_admin_user():
        return {"id": "test-admin-uuid", "role": "super_admin"}
    app.dependency_overrides[get_current_user] = override_admin_user

