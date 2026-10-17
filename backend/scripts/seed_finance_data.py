"""
Seed Script for Finance and Accounting Operations.
Populates realistic fee installments, overdue EMIs, payment transactions,
and reconciliation states for the Accountant Staff Dashboard.
"""
import asyncio
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import logging
import uuid

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.institute import (
    Batch,
    Course,
    FeeInstallment,
    FeeStatus,
    PaymentTransaction,
    Student,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_finance_data")


async def seed_finance():
    async with AsyncSessionLocal() as session:
        today = date.today()
        logger.info(f"Seeding financial data relative to reference date: {today}")

        # 1. Fetch available students and batches
        students_res = await session.execute(select(Student).order_by(Student.created_at.asc()))
        students = list(students_res.scalars().all())
        if not students:
            logger.error("No students found in database. Run main seed_data.py first.")
            return

        batches_res = await session.execute(select(Batch).order_by(Batch.created_at.asc()))
        batches = list(batches_res.scalars().all())
        default_batch = batches[0] if batches else None

        # 2. Define structured installments with realistic amounts and dates
        # Students:
        # 0: Aarav Sharma
        # 1: Diya Patel
        # 2: Rohan Verma
        # 3: Sneha Reddy
        # 4+: Other students
        s0 = students[0]
        s1 = students[1] if len(students) > 1 else s0
        s2 = students[2] if len(students) > 2 else s0
        s3 = students[3] if len(students) > 3 else s1
        s4 = students[4] if len(students) > 4 else s2

        installments_data = [
            # Aarav Sharma - Has paid 1st installment, 2nd upcoming
            {
                "student_id": s0.id,
                "batch_id": default_batch.id if default_batch else None,
                "title": "Semester 1 - Term 1",
                "amount_due": Decimal("45000.00"),
                "amount_paid": Decimal("45000.00"),
                "due_date": today - timedelta(days=45),
                "paid_date": today - timedelta(days=47),
                "status": FeeStatus.PAID,
                "receipt_number": "REC-2026-00101",
                "notes": "Full initial registration fee cleared.",
            },
            {
                "student_id": s0.id,
                "batch_id": default_batch.id if default_batch else None,
                "title": "Semester 1 - Term 2",
                "amount_due": Decimal("45000.00"),
                "amount_paid": Decimal("0.00"),
                "due_date": today + timedelta(days=4),  # Upcoming in 4 days!
                "paid_date": None,
                "status": FeeStatus.PENDING,
                "receipt_number": None,
                "notes": "Upcoming term tuition installment.",
            },
            # Diya Patel - Overdue EMI!
            {
                "student_id": s1.id,
                "batch_id": default_batch.id if default_batch else None,
                "title": "Module 1 - Tuition Fee",
                "amount_due": Decimal("60000.00"),
                "amount_paid": Decimal("30000.00"),
                "due_date": today - timedelta(days=12),  # 12 days overdue!
                "paid_date": today - timedelta(days=14),
                "status": FeeStatus.PARTIALLY_PAID,
                "receipt_number": "REC-2026-00102",
                "notes": "Partial payment of ₹30,000 received. Balance ₹30,000 overdue.",
            },
            # Rohan Verma - Critical Overdue EMI (35 days overdue)
            {
                "student_id": s2.id,
                "batch_id": default_batch.id if default_batch else None,
                "title": "Admission Installment 2",
                "amount_due": Decimal("50000.00"),
                "amount_paid": Decimal("0.00"),
                "due_date": today - timedelta(days=35),  # 35 days overdue!
                "paid_date": None,
                "status": FeeStatus.OVERDUE,
                "receipt_number": None,
                "notes": "Candidate missed second installment deadline.",
            },
            # Sneha Reddy - Paid via Bank Transfer, recently reconciled
            {
                "student_id": s3.id,
                "batch_id": default_batch.id if default_batch else None,
                "title": "Advanced AI Specialization - Fee",
                "amount_due": Decimal("75000.00"),
                "amount_paid": Decimal("75000.00"),
                "due_date": today - timedelta(days=10),
                "paid_date": today - timedelta(days=11),
                "status": FeeStatus.PAID,
                "receipt_number": "REC-2026-00103",
                "notes": "Paid in full via NEFT.",
            },
            # s4 - Due in next 2 days (Upcoming)
            {
                "student_id": s4.id,
                "batch_id": default_batch.id if default_batch else None,
                "title": "Cloud Computing Lab Fee",
                "amount_due": Decimal("35000.00"),
                "amount_paid": Decimal("15000.00"),
                "due_date": today + timedelta(days=2),  # Upcoming in 2 days
                "paid_date": today - timedelta(days=20),
                "status": FeeStatus.PARTIALLY_PAID,
                "receipt_number": "REC-2026-00104",
                "notes": "Lab seat booked with ₹15,000 advance. Final balance ₹20,000 due shortly.",
            },
        ]

        saved_installments = []
        for inst_dict in installments_data:
            existing = await session.execute(
                select(FeeInstallment).where(
                    FeeInstallment.student_id == inst_dict["student_id"],
                    FeeInstallment.title == inst_dict["title"],
                )
            )
            inst = existing.scalar_one_or_none()
            if not inst:
                inst = FeeInstallment(**inst_dict)
                session.add(inst)
                await session.flush()
                logger.info(f"Created fee installment '{inst.title}' for student {inst.student_id}")
            saved_installments.append(inst)

        # 3. Seed Realistic Payment Transactions
        # Payment 1: Aarav Sharma - Paid REC-2026-00101 (Reconciled)
        # Payment 2: Diya Patel - Partial Paid REC-2026-00102 (Unreconciled)
        # Payment 3: Sneha Reddy - Paid REC-2026-00103 (Reconciled)
        # Payment 4: Sneha Reddy - Additional Exam Fee (Discrepancy)
        # Payment 5: s4 - Partial Advance (Reconciled)
        transactions_data = [
            {
                "installment_id": saved_installments[0].id,
                "student_id": s0.id,
                "amount": Decimal("45000.00"),
                "payment_date": today - timedelta(days=47),
                "payment_method": "UPI",
                "transaction_reference": "UPI/2026/894729104",
                "receipt_number": "REC-2026-00101",
                "payment_status": "Successful",
                "reconciliation_status": "Reconciled",
                "reconciled_by": "accounts@edupilot.io",
                "reconciled_at": datetime.now(timezone.utc) - timedelta(days=46),
                "discrepancy_reason": None,
                "recorded_by": "accounts@edupilot.io",
                "notes": "Instant UPI confirmation from HDFC payment gateway.",
            },
            {
                "installment_id": saved_installments[2].id,
                "student_id": s1.id,
                "amount": Decimal("30000.00"),
                "payment_date": today - timedelta(days=14),
                "payment_method": "Bank Transfer",
                "transaction_reference": "NEFT-AXIS-202604812",
                "receipt_number": "REC-2026-00102",
                "payment_status": "Successful",
                "reconciliation_status": "Unreconciled",
                "reconciled_by": None,
                "reconciled_at": None,
                "discrepancy_reason": None,
                "recorded_by": "accounts@edupilot.io",
                "notes": "Bank transfer awaiting monthly account statement verification.",
            },
            {
                "installment_id": saved_installments[4].id,
                "student_id": s3.id,
                "amount": Decimal("75000.00"),
                "payment_date": today - timedelta(days=11),
                "payment_method": "Bank Transfer",
                "transaction_reference": "IMPS-ICICI-99281729",
                "receipt_number": "REC-2026-00103",
                "payment_status": "Successful",
                "reconciliation_status": "Reconciled",
                "reconciled_by": "accounts@edupilot.io",
                "reconciled_at": datetime.now(timezone.utc) - timedelta(days=10),
                "discrepancy_reason": None,
                "recorded_by": "accounts@edupilot.io",
                "notes": "Matched against ICICI corporate banking credit line.",
            },
            {
                "installment_id": saved_installments[5].id,
                "student_id": s4.id,
                "amount": Decimal("15000.00"),
                "payment_date": today - timedelta(days=20),
                "payment_method": "Cash",
                "transaction_reference": "CASH-REC-00104",
                "receipt_number": "REC-2026-00104",
                "payment_status": "Successful",
                "reconciliation_status": "Reconciled",
                "reconciled_by": "accounts@edupilot.io",
                "reconciled_at": datetime.now(timezone.utc) - timedelta(days=19),
                "discrepancy_reason": None,
                "recorded_by": "accounts@edupilot.io",
                "notes": "Deposited to institute cash counter; verified against counter register.",
            },
            {
                "installment_id": None,
                "student_id": s2.id,
                "amount": Decimal("25000.00"),
                "payment_date": today - timedelta(days=3),
                "payment_method": "UPI",
                "transaction_reference": "UPI/2026/778192031",
                "receipt_number": "REC-2026-00105",
                "payment_status": "Successful",
                "reconciliation_status": "Discrepancy",
                "reconciled_by": "accounts@edupilot.io",
                "reconciled_at": datetime.now(timezone.utc) - timedelta(days=2),
                "discrepancy_reason": "Bank statement credit was for ₹24,500 due to candidate bank charge deduction; pending ₹500 adjustment.",
                "recorded_by": "accounts@edupilot.io",
                "notes": "Candidate claims full payment, bank report indicates ₹500 discrepancy.",
            },
            {
                "installment_id": None,
                "student_id": s0.id,
                "amount": Decimal("20000.00"),
                "payment_date": today,
                "payment_method": "Card",
                "transaction_reference": "POS-HDFC-9938102",
                "receipt_number": "REC-2026-00106",
                "payment_status": "Successful",
                "reconciliation_status": "Unreconciled",
                "reconciled_by": None,
                "reconciled_at": None,
                "discrepancy_reason": None,
                "recorded_by": "accounts@edupilot.io",
                "notes": "POS terminal swipe at admissions counter today.",
            },
        ]

        for tx_dict in transactions_data:
            existing_tx = await session.execute(
                select(PaymentTransaction).where(
                    PaymentTransaction.transaction_reference == tx_dict["transaction_reference"]
                )
            )
            if not existing_tx.scalar_one_or_none():
                tx = PaymentTransaction(**tx_dict)
                session.add(tx)
                logger.info(f"Seeded payment transaction {tx.receipt_number} ({tx.transaction_reference})")

        await session.commit()
        logger.info("Finance and accounting operations data seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_finance())
