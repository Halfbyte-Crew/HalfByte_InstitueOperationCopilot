from datetime import date, timedelta
from decimal import Decimal
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_student_lifecycle(client: AsyncClient):
    # 1. Create Student
    payload = {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "phone": "+1234567890",
        "status": "Active",
    }
    res = await client.post("/api/v1/students", json=payload)
    assert res.status_code == 201
    created = res.json()
    student_id = created["id"]
    assert created["name"] == "Jane Doe"
    assert created["email"] == "jane.doe@example.com"

    # 2. Duplicate email rejected with 409 Conflict
    dup_res = await client.post("/api/v1/students", json=payload)
    assert dup_res.status_code == 409

    # 3. Retrieve Student
    get_res = await client.get(f"/api/v1/students/{student_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == student_id

    # 4. Update Student
    update_res = await client.patch(f"/api/v1/students/{student_id}", json={"phone": "+9876543210"})
    assert update_res.status_code == 200
    assert update_res.json()["phone"] == "+9876543210"

    # 5. List Students with filtering
    list_res = await client.get("/api/v1/students?search=Jane")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1


@pytest.mark.asyncio
async def test_course_and_batch_relationships(client: AsyncClient):
    # Create Course
    course_payload = {
        "code": "TST-101",
        "title": "Software Testing Systems",
        "duration_weeks": 8,
        "base_fee": "50000.00",
    }
    c_res = await client.post("/api/v1/courses", json=course_payload)
    assert c_res.status_code == 201
    course_id = c_res.json()["id"]

    # Duplicate course code check
    dup_c = await client.post("/api/v1/courses", json=course_payload)
    assert dup_c.status_code == 409

    # Create Trainer
    trainer_payload = {
        "name": "Alex Trainer",
        "email": "alex.t@example.com",
        "specialization": "QA Automation",
    }
    t_res = await client.post("/api/v1/trainers", json=trainer_payload)
    assert t_res.status_code == 201
    trainer_id = t_res.json()["id"]

    # Create Batch
    batch_payload = {
        "code": "TST-2026-A",
        "course_id": course_id,
        "trainer_id": trainer_id,
        "capacity": 25,
        "status": "Active",
    }
    b_res = await client.post("/api/v1/batches", json=batch_payload)
    assert b_res.status_code == 201
    batch_id = b_res.json()["id"]

    # Create Student & Enroll
    s_res = await client.post("/api/v1/students", json={
        "name": "Bob Smith",
        "email": "bob.s@example.com",
    })
    student_id = s_res.json()["id"]

    enr_res = await client.post(f"/api/v1/batches/{batch_id}/enrollments", json={
        "student_id": student_id,
        "batch_id": batch_id,
    })
    assert enr_res.status_code == 201

    # Duplicate enrollment rejected
    dup_enr = await client.post(f"/api/v1/batches/{batch_id}/enrollments", json={
        "student_id": student_id,
        "batch_id": batch_id,
    })
    assert dup_enr.status_code == 409


@pytest.mark.asyncio
async def test_duplicate_attendance_prevention(client: AsyncClient):
    # Setup Course, Batch, Student
    c_res = await client.post("/api/v1/courses", json={
        "code": "ATT-101",
        "title": "Attendance Course",
        "duration_weeks": 4,
    })
    course_id = c_res.json()["id"]

    b_res = await client.post("/api/v1/batches", json={
        "code": "ATT-2026-A",
        "course_id": course_id,
    })
    batch_id = b_res.json()["id"]

    s_res = await client.post("/api/v1/students", json={
        "name": "Charlie Day",
        "email": "charlie@example.com",
    })
    student_id = s_res.json()["id"]

    today_str = str(date.today())

    # First attendance marking
    att_res = await client.post("/api/v1/attendance", json={
        "student_id": student_id,
        "batch_id": batch_id,
        "session_date": today_str,
        "status": "Present",
    })
    assert att_res.status_code == 201

    # Second attendance on same day must fail with 409
    dup_att = await client.post("/api/v1/attendance", json={
        "student_id": student_id,
        "batch_id": batch_id,
        "session_date": today_str,
        "status": "Absent",
    })
    assert dup_att.status_code == 409


@pytest.mark.asyncio
async def test_fee_installment_validation_and_payments(client: AsyncClient):
    # Create Student
    s_res = await client.post("/api/v1/students", json={
        "name": "Diana Prince",
        "email": "diana@example.com",
    })
    student_id = s_res.json()["id"]

    # Create Fee Installment
    fee_payload = {
        "student_id": student_id,
        "title": "Tuition Part 1",
        "amount_due": "50000.00",
        "due_date": str(date.today() + timedelta(days=15)),
    }
    f_res = await client.post("/api/v1/fees", json=fee_payload)
    assert f_res.status_code == 201
    installment_id = f_res.json()["id"]
    assert Decimal(f_res.json()["amount_due"]) == Decimal("50000.00")
    assert Decimal(f_res.json()["amount_paid"]) == Decimal("0.00")

    # Record partial payment
    pay_res = await client.post(f"/api/v1/fees/{installment_id}/payments", json={
        "payment_amount": "20000.00",
        "receipt_number": "REC-TEST-001",
    })
    assert pay_res.status_code == 200
    assert pay_res.json()["status"] == "Partially Paid"
    assert Decimal(pay_res.json()["amount_paid"]) == Decimal("20000.00")

    # Overpayment attempt rejected
    overpay_res = await client.post(f"/api/v1/fees/{installment_id}/payments", json={
        "payment_amount": "40000.00",  # remaining balance is 30,000
    })
    assert overpay_res.status_code == 400

    # Final payment clears installment
    final_res = await client.post(f"/api/v1/fees/{installment_id}/payments", json={
        "payment_amount": "30000.00",
    })
    assert final_res.status_code == 200
    assert final_res.json()["status"] == "Paid"
    assert Decimal(final_res.json()["amount_paid"]) == Decimal("50000.00")
