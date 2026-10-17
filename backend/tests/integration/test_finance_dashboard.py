"""
Integration tests for Accountant Staff Dashboard and Financial Operations.
Validates:
- Strict RBAC: only finance/admin roles can access; counselor/trainer denied (403)
- Real metric calculations (total collected, pending, overdue, upcoming)
- Partial payment and full payment recording with balance updates
- Prevention of overpayment and duplicate transaction references
- Reconciliation workflows (marking reconciled, flagging discrepancy)
- Financial reports generation and CSV export
"""
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.main import app
from app.models.institute import (
    Batch,
    Course,
    FeeInstallment,
    FeeStatus,
    PaymentTransaction,
    Student,
)


@pytest.fixture
def finance_user():
    return {
        "id": "accounts@edupilot.io",
        "email": "accounts@edupilot.io",
        "role": "finance",
        "name": "Finance Manager",
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
def trainer_user():
    return {
        "id": "trainer@edupilot.io",
        "email": "trainer@edupilot.io",
        "role": "trainer",
        "name": "Prof. Anita Desai",
    }


@pytest.fixture(autouse=True)
def restore_auth():
    yield
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "super_admin@edupilot.io",
        "email": "super_admin@edupilot.io",
        "role": "super_admin",
        "name": "Super Admin",
    }


@pytest.mark.asyncio
async def test_finance_role_access_and_unauthorized_denial(
    client: AsyncClient,
    finance_user,
    counselor_user,
    trainer_user,
):
    """
    Finance endpoints are accessible to finance role but strictly forbidden
    to counselors, trainers, and other unauthorized accounts.
    """
    # 1. Counselor tries to view financial overview -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: counselor_user
    res_counselor = await client.get("/api/v1/finance/overview")
    assert res_counselor.status_code == 403

    # 2. Trainer tries to view fee list -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: trainer_user
    res_trainer = await client.get("/api/v1/finance/fees")
    assert res_trainer.status_code == 403

    # 3. Finance user accesses -> 200 OK
    app.dependency_overrides[get_current_user] = lambda: finance_user
    res_finance = await client.get("/api/v1/finance/overview")
    assert res_finance.status_code == 200
    data = res_finance.json()
    assert "total_collected" in data
    assert "total_pending" in data
    assert "overdue_amount" in data
    assert "upcoming_amount" in data


@pytest.mark.asyncio
async def test_finance_overview_and_calculations(
    client: AsyncClient,
    finance_user,
    db_session: AsyncSession,
):
    """Test overview metrics, overdue EMI detection, and upcoming dues."""
    app.dependency_overrides[get_current_user] = lambda: finance_user
    today = date.today()

    # Create a student with overdue and upcoming installments
    student = Student(
        name="Financial Test Student",
        email="fin.test@example.com",
    )
    db_session.add(student)
    await db_session.flush()

    # Overdue installment (10 days past, 25k balance)
    inst_overdue = FeeInstallment(
        student_id=student.id,
        title="Overdue Tuition Part 1",
        amount_due=Decimal("50000.00"),
        amount_paid=Decimal("25000.00"),
        due_date=today - timedelta(days=10),
        status=FeeStatus.PARTIALLY_PAID,
    )
    # Upcoming installment (due in 3 days, 30k balance)
    inst_upcoming = FeeInstallment(
        student_id=student.id,
        title="Upcoming Lab Fee",
        amount_due=Decimal("30000.00"),
        amount_paid=Decimal("0.00"),
        due_date=today + timedelta(days=3),
        status=FeeStatus.PENDING,
    )
    db_session.add_all([inst_overdue, inst_upcoming])

    # Record a successful payment in this month
    payment = PaymentTransaction(
        installment_id=inst_overdue.id,
        student_id=student.id,
        amount=Decimal("25000.00"),
        payment_date=today,
        payment_method="UPI",
        transaction_reference=f"UPI-TEST-{uuid.uuid4().hex[:8]}",
        receipt_number=f"REC-TEST-{uuid.uuid4().hex[:6]}",
        payment_status="Successful",
        reconciliation_status="Unreconciled",
        recorded_by="accounts@edupilot.io",
    )
    db_session.add(payment)
    await db_session.commit()

    # Verify Overview endpoint
    res = await client.get("/api/v1/finance/overview?period=this_month")
    assert res.status_code == 200
    ov = res.json()
    assert Decimal(ov["total_collected"]) >= Decimal("25000.00")
    assert Decimal(ov["overdue_amount"]) >= Decimal("25000.00")
    assert Decimal(ov["upcoming_amount"]) >= Decimal("30000.00")
    assert ov["reconciliation_summary"]["unreconciled_count"] >= 1


@pytest.mark.asyncio
async def test_record_payment_and_installment_lifecycle(
    client: AsyncClient,
    finance_user,
    db_session: AsyncSession,
):
    """
    Test recording a payment:
    - Atomically updates installment balance
    - Sets status to Partially Paid or Paid
    - Blocks overpayment with 400
    - Blocks duplicate transaction reference with 400
    """
    app.dependency_overrides[get_current_user] = lambda: finance_user
    today = date.today()

    student = Student(
        name="Payment Lifecycle Student",
        email=f"pay.life.{uuid.uuid4().hex[:6]}@example.com",
    )
    db_session.add(student)
    await db_session.flush()

    installment = FeeInstallment(
        student_id=student.id,
        title="Term 1 Tuition",
        amount_due=Decimal("40000.00"),
        amount_paid=Decimal("0.00"),
        due_date=today + timedelta(days=15),
        status=FeeStatus.PENDING,
    )
    db_session.add(installment)
    await db_session.commit()
    await db_session.refresh(installment)

    unique_ref = f"REF-{uuid.uuid4().hex[:8]}"

    # 1. Overpayment must fail
    res_over = await client.post(
        "/api/v1/finance/payments",
        json={
            "student_id": str(student.id),
            "installment_id": str(installment.id),
            "amount": 50000.00,  # exceeds 40,000!
            "payment_method": "Bank Transfer",
            "transaction_reference": unique_ref,
        },
    )
    assert res_over.status_code == 400
    assert "exceeds remaining balance" in res_over.json()["detail"]

    # 2. Valid partial payment: ₹15,000
    res_pay1 = await client.post(
        "/api/v1/finance/payments",
        json={
            "student_id": str(student.id),
            "installment_id": str(installment.id),
            "amount": 15000.00,
            "payment_method": "Bank Transfer",
            "transaction_reference": unique_ref,
            "notes": "First partial tranche",
        },
    )
    assert res_pay1.status_code == 201
    pay1_data = res_pay1.json()
    assert pay1_data["amount"] == "15000.00"
    assert pay1_data["receipt_number"].startswith("REC-")

    # Verify installment reflects ₹15,000 paid and status is Partially Paid
    await db_session.refresh(installment)
    assert installment.amount_paid == Decimal("15000.00")
    assert installment.status == FeeStatus.PARTIALLY_PAID

    # 3. Duplicate transaction reference must fail
    res_dup = await client.post(
        "/api/v1/finance/payments",
        json={
            "student_id": str(student.id),
            "installment_id": str(installment.id),
            "amount": 5000.00,
            "payment_method": "UPI",
            "transaction_reference": unique_ref,  # Same ref!
        },
    )
    assert res_dup.status_code == 400
    assert "already been recorded" in res_dup.json()["detail"]

    # 4. Final payment of remaining balance: ₹25,000
    ref_final = f"REF-FINAL-{uuid.uuid4().hex[:8]}"
    res_pay2 = await client.post(
        "/api/v1/finance/payments",
        json={
            "student_id": str(student.id),
            "installment_id": str(installment.id),
            "amount": 25000.00,
            "payment_method": "UPI",
            "transaction_reference": ref_final,
        },
    )
    assert res_pay2.status_code == 201

    # Verify installment is now fully Paid
    await db_session.refresh(installment)
    assert installment.amount_paid == Decimal("40000.00")
    assert installment.status == FeeStatus.PAID

    # 5. Fetch Receipt Details
    receipt_id = res_pay2.json()["id"]
    res_rec = await client.get(f"/api/v1/finance/payments/{receipt_id}/receipt")
    assert res_rec.status_code == 200
    receipt = res_rec.json()
    assert receipt["amount_paid"] == "25000.00"
    assert receipt["student"]["name"] == "Payment Lifecycle Student"
    assert receipt["installment"]["title"] == "Term 1 Tuition"


@pytest.mark.asyncio
async def test_payment_reconciliation_workflow(
    client: AsyncClient,
    finance_user,
    db_session: AsyncSession,
):
    """
    Test reconciliation flow:
    - Mark transaction as reconciled (stores who & when)
    - Flag discrepancy with reason
    - Summary updates accordingly
    """
    app.dependency_overrides[get_current_user] = lambda: finance_user
    today = date.today()

    student = Student(
        name="Reconciliation Student",
        email=f"rec.stu.{uuid.uuid4().hex[:6]}@example.com",
    )
    db_session.add(student)
    await db_session.flush()

    tx = PaymentTransaction(
        student_id=student.id,
        amount=Decimal("18000.00"),
        payment_date=today,
        payment_method="UPI",
        transaction_reference=f"UPI-REC-{uuid.uuid4().hex[:8]}",
        receipt_number=f"REC-REC-{uuid.uuid4().hex[:6]}",
        payment_status="Successful",
        reconciliation_status="Unreconciled",
        recorded_by="accounts@edupilot.io",
    )
    db_session.add(tx)
    await db_session.commit()
    await db_session.refresh(tx)

    # 1. Flag as discrepancy
    res_flag = await client.post(
        f"/api/v1/finance/reconciliation/{tx.id}/flag-discrepancy",
        json={"reason": "Amount credited in bank is ₹17,900 due to chargeback fee."},
    )
    assert res_flag.status_code == 200
    assert res_flag.json()["reconciliation_status"] == "Discrepancy"
    assert "₹17,900" in res_flag.json()["discrepancy_reason"]

    # 2. Mark as Reconciled
    res_rec = await client.post(f"/api/v1/finance/reconciliation/{tx.id}/reconcile")
    assert res_rec.status_code == 200
    assert res_rec.json()["reconciliation_status"] == "Reconciled"
    assert res_rec.json()["reconciled_by"] == "accounts@edupilot.io"
    assert res_rec.json()["discrepancy_reason"] is None


@pytest.mark.asyncio
async def test_financial_reports_and_csv_export(
    client: AsyncClient,
    finance_user,
):
    """Test generation of all 5 report types and streaming CSV exports."""
    app.dependency_overrides[get_current_user] = lambda: finance_user

    report_types = ["fee_collection", "outstanding_fees", "overdue_emis", "upcoming_dues", "reconciliation"]

    for rep in report_types:
        # JSON endpoint
        res = await client.get(f"/api/v1/finance/reports/{rep}")
        assert res.status_code == 200
        assert res.json()["report_type"] == rep

        # CSV export endpoint
        res_csv = await client.get(f"/api/v1/finance/reports/{rep}/export")
        assert res_csv.status_code == 200
        assert "text/csv" in res_csv.headers["content-type"]
        assert f"filename={rep}_" in res_csv.headers["content-disposition"]
        assert len(res_csv.text) > 0


@pytest.mark.asyncio
async def test_payment_receipt_generation(
    client: AsyncClient,
    db_session: AsyncSession,
    finance_user,
):
    """Test fetching printable payment receipt with student, course, batch, and installment details."""
    app.dependency_overrides[get_current_user] = lambda: finance_user

    # Create full course, batch, student, installment, and payment
    course = Course(code=f"CRS-REC-{uuid.uuid4().hex[:4]}", title="AI Engineering", duration_weeks=12, base_fee=Decimal("50000.00"))
    db_session.add(course)
    await db_session.flush()

    batch = Batch(code=f"BAT-REC-{uuid.uuid4().hex[:4]}", course_id=course.id, capacity=25)
    db_session.add(batch)
    await db_session.flush()

    student = Student(name="Receipt Test Student", email=f"receipt.{uuid.uuid4().hex[:6]}@example.com")
    db_session.add(student)
    await db_session.flush()

    inst = FeeInstallment(
        student_id=student.id,
        batch_id=batch.id,
        title="Admission Fee",
        amount_due=Decimal("25000.00"),
        amount_paid=Decimal("25000.00"),
        due_date=date.today(),
        status=FeeStatus.PAID,
    )
    db_session.add(inst)
    await db_session.flush()

    tx = PaymentTransaction(
        installment_id=inst.id,
        student_id=student.id,
        amount=Decimal("25000.00"),
        payment_date=date.today(),
        payment_method="UPI",
        transaction_reference=f"REC-UTR-{uuid.uuid4().hex[:6]}",
        receipt_number=f"REC-{date.today().year}-{uuid.uuid4().hex[:4].upper()}",
        payment_status="Successful",
        reconciliation_status="Reconciled",
        recorded_by="accounts@edupilot.io",
    )
    db_session.add(tx)
    await db_session.commit()

    res = await client.get(f"/api/v1/finance/payments/{tx.id}/receipt")
    assert res.status_code == 200
    data = res.json()
    assert data["receipt_number"] == tx.receipt_number
    assert data["student_name"] == "Receipt Test Student"
    assert data["course_name"] == "AI Engineering"
    assert data["batch_name"] == batch.code
    assert float(data["amount_paid"]) == 25000.0
