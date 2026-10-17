"""Integration tests for Counselor Operations & Dashboard endpoints."""
import uuid
from datetime import date, datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.main import app
from app.models.institute import (
    Admission,
    ApprovalRequest,
    Course,
    CounselorTask,
    Enquiry,
    InteractionLog,
    Student,
)


@pytest.fixture
def counselor_user():
    return {"id": "counselor@edupilot.io", "role": "counselor", "name": "Priya Sharma"}


@pytest.fixture
def other_counselor_user():
    return {"id": "coordinator@edupilot.io", "role": "coordinator", "name": "Ravi Nair"}


@pytest.fixture
def trainer_user():
    return {"id": "trainer@edupilot.io", "role": "trainer", "name": "Prof. Anita"}


@pytest.fixture(autouse=True)
def restore_admin_override():
    yield
    async def override_admin_user():
        return {"id": "test-admin-uuid", "role": "super_admin"}
    app.dependency_overrides[get_current_user] = override_admin_user


@pytest.mark.asyncio
async def test_counselor_role_access_and_unauthorized_denial(
    client: AsyncClient,
    counselor_user,
    trainer_user,
):
    """Counselors have access to /counselor endpoints; trainers are denied."""
    # 1. Trainer attempted access -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: trainer_user
    res_trainer = await client.get("/api/v1/counselor/summary")
    assert res_trainer.status_code == 403

    # 2. Counselor access -> 200 OK
    app.dependency_overrides[get_current_user] = lambda: counselor_user
    res_counselor = await client.get("/api/v1/counselor/summary")
    assert res_counselor.status_code == 200
    data = res_counselor.json()
    assert "assigned_enquiries" in data
    assert "active_admissions" in data
    assert "followups_due_today" in data
    assert "overdue_followups" in data
    assert "pipeline_summary" in data


@pytest.mark.asyncio
async def test_enquiry_lifecycle_and_duplicate_conversion_prevention(
    client: AsyncClient,
    counselor_user,
    db_session: AsyncSession,
):
    """Test enquiry creation, updates, interaction notes, and duplicate conversion prevention."""
    app.dependency_overrides[get_current_user] = lambda: counselor_user

    # 1. Create Enquiry
    payload = {
        "name": "Tanvi Joshi",
        "email": "tanvi.j@example.com",
        "phone": "+91 99999 11111",
        "source": "Website",
        "status": "New",
        "notes": "Enquiring about Python and Data Science.",
        "next_follow_up_date": date.today().isoformat(),
    }
    res = await client.post("/api/v1/counselor/enquiries", json=payload)
    assert res.status_code == 201
    enq_data = res.json()
    enq_id = enq_data["id"]
    assert enq_data["name"] == "Tanvi Joshi"
    assert enq_data["assigned_counselor_email"] == "counselor@edupilot.io"

    # 2. Record Interaction Attempt
    log_payload = {
        "interaction_type": "Call",
        "summary": "Outreach call completed",
        "details": "Discussed weekend class timings. Student interested.",
    }
    res_int = await client.post(f"/api/v1/counselor/enquiries/{enq_id}/interactions", json=log_payload)
    assert res_int.status_code == 200
    assert res_int.json()["interaction_type"] == "Call"

    # Check that enquiry status automatically transitioned to Contacted
    res_detail = await client.get(f"/api/v1/counselor/enquiries/{enq_id}")
    assert res_detail.status_code == 200
    assert res_detail.json()["status"] == "Contacted"
    assert len(res_detail.json()["interactions"]) >= 1

    # 3. Convert Enquiry to Admission
    convert_payload = {
        "course_title": "Data Science & AI",
        "notes": "Candidate ready to begin application.",
    }
    res_conv = await client.post(f"/api/v1/counselor/enquiries/{enq_id}/convert", json=convert_payload)
    assert res_conv.status_code == 200
    adm_data = res_conv.json()
    assert adm_data["student_name"] == "Tanvi Joshi"
    assert adm_data["stage"] == "Application Started"

    # Verify Enquiry reflects conversion
    res_enq_after = await client.get(f"/api/v1/counselor/enquiries/{enq_id}")
    assert res_enq_after.json()["status"] == "Converted"
    assert res_enq_after.json()["converted_to_admission_id"] == adm_data["id"]

    # 4. Strict check: Duplicate conversion MUST fail with 400
    res_dup = await client.post(f"/api/v1/counselor/enquiries/{enq_id}/convert", json=convert_payload)
    assert res_dup.status_code == 400
    assert "already been converted" in res_dup.json()["detail"]


@pytest.mark.asyncio
async def test_counselor_data_isolation(
    client: AsyncClient,
    counselor_user,
    other_counselor_user,
    db_session: AsyncSession,
):
    """Counselor A cannot view or update Counselor B's enquiries, admissions, or tasks."""
    # Create enquiry assigned to Counselor B (Ravi)
    enq_b = Enquiry(
        name="Private Prospect B",
        email="private.b@example.com",
        source="Referral",
        status="New",
        assigned_counselor_email="coordinator@edupilot.io",
    )
    db_session.add(enq_b)
    await db_session.commit()
    await db_session.refresh(enq_b)

    # Counselor A (Priya) tries to access -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: counselor_user
    res_view = await client.get(f"/api/v1/counselor/enquiries/{enq_b.id}")
    assert res_view.status_code == 403
    assert "assigned to another counselor" in res_view.json()["detail"]

    # Counselor A tries to update -> 403 Forbidden
    res_patch = await client.patch(
        f"/api/v1/counselor/enquiries/{enq_b.id}",
        json={"notes": "Hacked notes"},
    )
    assert res_patch.status_code == 403

    # Counselor B can access their own enquiry -> 200 OK
    app.dependency_overrides[get_current_user] = lambda: other_counselor_user
    res_ravi = await client.get(f"/api/v1/counselor/enquiries/{enq_b.id}")
    assert res_ravi.status_code == 200
    assert res_ravi.json()["name"] == "Private Prospect B"


@pytest.mark.asyncio
async def test_follow_up_tasks_schedule_views_and_completion(
    client: AsyncClient,
    counselor_user,
    db_session: AsyncSession,
):
    """Test follow-up tasks: due today, upcoming, overdue, reschedule, and complete."""
    app.dependency_overrides[get_current_user] = lambda: counselor_user
    now = datetime.now(timezone.utc)

    # 1. Create a follow-up task
    task_payload = {
        "title": "Call candidate regarding degree certificate",
        "description": "Urgent verification call",
        "due_datetime": (now + timedelta(hours=3)).isoformat(),
        "priority": "High",
    }
    res = await client.post("/api/v1/counselor/follow-ups", json=task_payload)
    assert res.status_code == 201
    task_id = res.json()["id"]

    # 2. Reschedule task
    resched_payload = {
        "new_due_datetime": (now + timedelta(days=2)).isoformat(),
        "reason": "Candidate requested weekend call.",
    }
    res_resched = await client.post(f"/api/v1/counselor/follow-ups/{task_id}/reschedule", json=resched_payload)
    assert res_resched.status_code == 200
    new_task = res_resched.json()
    assert new_task["rescheduled_from_id"] == task_id
    assert new_task["status"] == "Pending"

    # 3. Complete the task
    res_comp = await client.post(f"/api/v1/counselor/follow-ups/{new_task['id']}/complete")
    assert res_comp.status_code == 200
    assert res_comp.json()["status"] == "Completed"
    assert res_comp.json()["completed_at"] is not None


@pytest.mark.asyncio
async def test_admission_stage_restrictions_and_admin_approval(
    client: AsyncClient,
    counselor_user,
    db_session: AsyncSession,
):
    """Counselor cannot directly approve/enroll an admission; must submit approval request."""
    app.dependency_overrides[get_current_user] = lambda: counselor_user

    # 1. Create an Admission
    adm = Admission(
        student_name="Rahul Nair",
        student_email="rahul.nair@example.com",
        course_title="Full Stack Web Development",
        assigned_counselor_email="counselor@edupilot.io",
        stage="Application Started",
        application_date=date.today(),
    )
    db_session.add(adm)
    await db_session.commit()
    await db_session.refresh(adm)

    # 2. Verify Detail Endpoint works without error
    res_detail = await client.get(f"/api/v1/counselor/admissions/{adm.id}")
    assert res_detail.status_code == 200
    assert res_detail.json()["student_name"] == "Rahul Nair"
    assert "current_stage" in res_detail.json()
    assert "course_name" in res_detail.json()

    # 3. Counselor updates stage with current_stage alias
    res_patch = await client.patch(
        f"/api/v1/counselor/admissions/{adm.id}",
        json={"current_stage": "Documents Pending", "notes": "Waiting for ID proof"},
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["stage"] == "Documents Pending"

    # 4. Counselor tries to mark 'Admission Approved' directly -> 403 Forbidden!
    res_illegal_approve = await client.patch(
        f"/api/v1/counselor/admissions/{adm.id}",
        json={"stage": "Admission Approved"},
    )
    assert res_illegal_approve.status_code == 403
    assert "Administrator authorization" in res_illegal_approve.json()["detail"]

    # 5. Counselor submits official approval request -> 200 OK
    res_submit = await client.post(
        f"/api/v1/counselor/admissions/{adm.id}/submit-approval",
        json={"notes": "All original certificates verified."},
    )
    assert res_submit.status_code == 200
    submit_data = res_submit.json()
    assert submit_data["stage"] == "Documents Under Review"
    assert "approval_request_id" in submit_data

    # 6. Duplicate approval submission fails with 400
    res_dup_submit = await client.post(
        f"/api/v1/counselor/admissions/{adm.id}/submit-approval",
        json={"notes": "Duplicate request"},
    )
    assert res_dup_submit.status_code == 400

    # 7. Admin approves the request -> Admission stage automatically synchronizes to 'Admission Approved'
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "admin@edupilot.io",
        "email": "admin@edupilot.io",
        "role": "admin",
        "name": "Super Admin",
    }
    approval_id = submit_data["approval_request_id"]
    res_admin_app = await client.post(f"/api/v1/approvals/{approval_id}/approve")
    assert res_admin_app.status_code == 200
    assert res_admin_app.json()["status"] == "Approved"

    # Verify that the Admission stage was synchronized
    app.dependency_overrides[get_current_user] = lambda: counselor_user
    res_final = await client.get(f"/api/v1/counselor/admissions/{adm.id}")
    assert res_final.status_code == 200
    assert res_final.json()["stage"] == "Admission Approved"
    assert res_final.json()["approval_status"] == "Approved"


@pytest.mark.asyncio
async def test_provisioned_counselor_dashboard_and_approval_workflow(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """
    Verifies that a newly provisioned counselor (e.g. ayush202@gmail.com) sees
    institute synthetic operational data, active admission pipeline, and can
    submit an admission approval request to the administrator.
    """
    ayush_user = {
        "id": "ayush202@gmail.com",
        "email": "ayush202@gmail.com",
        "role": "counselor",
        "name": "Ayush Counselor",
    }
    app.dependency_overrides[get_current_user] = lambda: ayush_user

    # 1. Summary includes operational data
    res_summary = await client.get("/api/v1/counselor/summary")
    assert res_summary.status_code == 200
    summary_data = res_summary.json()
    assert "active_admissions" in summary_data
    assert "pipeline_summary" in summary_data

    # 2. Seed a demo admission with pending documents
    demo_adm = Admission(
        student_name="Devansh Roy",
        student_email="devansh.roy@example.com",
        course_title="Cloud & DevOps Engineering",
        assigned_counselor_email="counselor@edupilot.io",
        stage="Documents Pending",
        application_date=date.today(),
        documents_required=[
            {"name": "Class 10th Certificate", "status": "Verified"},
            {"name": "Government Photo ID", "status": "Verified"},
        ],
    )
    db_session.add(demo_adm)
    await db_session.commit()
    await db_session.refresh(demo_adm)

    # 3. Ayush lists admissions and sees Devansh
    res_list = await client.get("/api/v1/counselor/admissions")
    assert res_list.status_code == 200
    adms = res_list.json()["items"]
    devansh_entry = next((a for a in adms if a["id"] == str(demo_adm.id)), None)
    assert devansh_entry is not None
    assert devansh_entry["stage"] == "Documents Pending"
    assert devansh_entry["approval_request_id"] is None

    # 4. Ayush submits Devansh's application for Admin Approval
    approval_payload = {"notes": "All identity and academic marksheets verified by Ayush."}
    res_submit = await client.post(
        f"/api/v1/counselor/admissions/{demo_adm.id}/submit-approval",
        json=approval_payload,
    )
    assert res_submit.status_code == 200
    submit_res = res_submit.json()
    assert submit_res["stage"] == "Documents Under Review"
    req_id = submit_res["approval_request_id"]

    # 5. Admin reviews and approves the request
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "admin@edupilot.io",
        "email": "admin@edupilot.io",
        "role": "admin",
        "name": "Super Admin",
    }
    res_approve = await client.post(f"/api/v1/approvals/{req_id}/approve")
    assert res_approve.status_code == 200

    # 6. Ayush views updated admission status
    app.dependency_overrides[get_current_user] = lambda: ayush_user
    res_after = await client.get(f"/api/v1/counselor/admissions/{demo_adm.id}")
    assert res_after.status_code == 200
    assert res_after.json()["stage"] == "Admission Approved"
