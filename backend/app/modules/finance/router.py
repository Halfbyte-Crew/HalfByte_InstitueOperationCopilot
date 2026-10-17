"""
Finance and Accounting Router for EduPilot Institute Operations.
Handles fee collections, EMI monitoring, payment transactions, reconciliation,
financial reports, and CSV exports with decimal-safe numeric calculations.
"""
import csv
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import io
import logging
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.institute import (
    Batch,
    BatchEnrollment,
    Course,
    FeeInstallment,
    FeeStatus,
    PaymentTransaction,
    Student,
)
from app.modules.finance.schemas import (
    CollectionTrendItem,
    FeeCollectionReportData,
    FeeInstallmentRow,
    FeeInstallmentsListResponse,
    FinanceOverviewResponse,
    FlagDiscrepancyRequest,
    OutstandingFeesReportData,
    OutstandingFeesReportRow,
    OverdueEMIReportData,
    OverdueEMIReportRow,
    OverdueHighlight,
    PaymentMethodSummary,
    PaymentTransactionResponse,
    PaymentTransactionsListResponse,
    ReceiptDetailsResponse,
    ReconciliationSummary,
    RecordPaymentRequest,
    UpcomingDuesReportData,
    UpcomingDuesReportRow,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/finance",
    tags=["Finance & Accounting Operations"],
    dependencies=[Depends(require_roles(["finance", "admin", "super_admin"]))],
)


# Helper: date bounds from period name
def _get_period_bounds(period: str, start_date: Optional[date], end_date: Optional[date]):
    today = date.today()
    if period == "today":
        return today, today
    elif period == "this_month":
        start = today.replace(day=1)
        # End of current month
        next_month = start.replace(day=28) + timedelta(days=4)
        end = next_month - timedelta(days=next_month.day)
        return start, end
    elif period == "this_quarter":
        quarter_month = ((today.month - 1) // 3) * 3 + 1
        start = today.replace(month=quarter_month, day=1)
        end_month = quarter_month + 2
        # End of quarter month
        temp = today.replace(month=end_month, day=28) + timedelta(days=4)
        end = temp - timedelta(days=temp.day)
        return start, end
    elif period == "custom" and start_date and end_date:
        return start_date, end_date
    else:  # all_time or default
        return date(2020, 1, 1), today + timedelta(days=365)


# ===========================================================================
# 1. Overview & Financial Summary
# ===========================================================================

@router.get("/overview", response_model=FinanceOverviewResponse)
async def get_finance_overview(
    period: str = Query("this_month", description="today, this_month, this_quarter, all_time, custom"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Overview summary KPIs: Total Fees Collected, Pending, Overdue EMIs,
    Upcoming Dues, Reconciliation summary, and recent collections.
    """
    today = date.today()
    actual_start = start_date or from_date
    actual_end = end_date or to_date
    p_start, p_end = _get_period_bounds(period, actual_start, actual_end)

    # 1. Total Collected in period (from successful payment transactions)
    collected_stmt = select(
        func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00"))
    ).where(
        and_(
            PaymentTransaction.payment_status == "Successful",
            PaymentTransaction.payment_date >= p_start,
            PaymentTransaction.payment_date <= p_end,
        )
    )
    total_collected = (await db.execute(collected_stmt)).scalar() or Decimal("0.00")

    # 2. Total Course Fees and Outstanding Balances
    course_fees_stmt = select(
        func.coalesce(func.sum(FeeInstallment.amount_due), Decimal("0.00")),
        func.coalesce(func.sum(FeeInstallment.amount_paid), Decimal("0.00")),
    )
    fees_res = (await db.execute(course_fees_stmt)).first()
    total_course_fees = fees_res[0] or Decimal("0.00")
    all_time_paid = fees_res[1] or Decimal("0.00")
    total_pending = max(Decimal("0.00"), total_course_fees - all_time_paid)

    collection_rate = (
        f"{(all_time_paid / total_course_fees * 100):.1f}%"
        if total_course_fees > Decimal("0.00")
        else "0.0%"
    )

    # 3. Overdue EMIs (due_date < today AND amount_paid < amount_due)
    overdue_stmt = select(
        func.count(FeeInstallment.id),
        func.coalesce(func.sum(FeeInstallment.amount_due - FeeInstallment.amount_paid), Decimal("0.00")),
    ).where(
        and_(
            FeeInstallment.due_date < today,
            FeeInstallment.amount_paid < FeeInstallment.amount_due,
        )
    )
    overdue_res = (await db.execute(overdue_stmt)).first()
    overdue_count = overdue_res[0] or 0
    overdue_amount = overdue_res[1] or Decimal("0.00")

    # 4. Upcoming Dues (today <= due_date <= today + 7 days AND amount_paid < amount_due)
    next_week = today + timedelta(days=7)
    upcoming_stmt = select(
        func.count(FeeInstallment.id),
        func.coalesce(func.sum(FeeInstallment.amount_due - FeeInstallment.amount_paid), Decimal("0.00")),
    ).where(
        and_(
            FeeInstallment.due_date >= today,
            FeeInstallment.due_date <= next_week,
            FeeInstallment.amount_paid < FeeInstallment.amount_due,
        )
    )
    upcoming_res = (await db.execute(upcoming_stmt)).first()
    upcoming_count = upcoming_res[0] or 0
    upcoming_amount = upcoming_res[1] or Decimal("0.00")

    # 5. Reconciliation Summary
    rec_stmt = select(
        PaymentTransaction.reconciliation_status,
        func.count(PaymentTransaction.id),
        func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00")),
    ).where(
        PaymentTransaction.payment_status == "Successful"
    ).group_by(PaymentTransaction.reconciliation_status)

    rec_rows = (await db.execute(rec_stmt)).all()
    rec_summary = ReconciliationSummary()
    for row in rec_rows:
        status_val, count_val, amount_val = row[0], row[1], row[2]
        if status_val == "Reconciled":
            rec_summary.reconciled_count = count_val
            rec_summary.reconciled_amount = amount_val
        elif status_val == "Unreconciled":
            rec_summary.unreconciled_count = count_val
            rec_summary.unreconciled_amount = amount_val
        elif status_val == "Discrepancy":
            rec_summary.discrepancy_count = count_val
            rec_summary.discrepancy_amount = amount_val
        rec_summary.total_count += count_val
        rec_summary.total_amount += amount_val

    # 6. Payment Methods Breakdown in period
    methods_stmt = select(
        PaymentTransaction.payment_method,
        func.count(PaymentTransaction.id),
        func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00")),
    ).where(
        and_(
            PaymentTransaction.payment_status == "Successful",
            PaymentTransaction.payment_date >= p_start,
            PaymentTransaction.payment_date <= p_end,
        )
    ).group_by(PaymentTransaction.payment_method)

    methods_rows = (await db.execute(methods_stmt)).all()
    methods_breakdown = [
        PaymentMethodSummary(method=row[0], count=row[1], amount=row[2])
        for row in methods_rows
    ]

    # 7. Recent 5 Collections
    recent_tx_stmt = (
        select(PaymentTransaction, Student.name.label("student_name"))
        .join(Student, PaymentTransaction.student_id == Student.id)
        .where(PaymentTransaction.payment_status == "Successful")
        .order_by(PaymentTransaction.payment_date.desc(), PaymentTransaction.created_at.desc())
        .limit(5)
    )
    recent_tx_rows = (await db.execute(recent_tx_stmt)).all()
    recent_collections = [
        {
            "id": str(row.PaymentTransaction.id),
            "receipt_number": row.PaymentTransaction.receipt_number,
            "student_name": row.student_name,
            "amount": str(row.PaymentTransaction.amount),
            "payment_method": row.PaymentTransaction.payment_method,
            "payment_date": row.PaymentTransaction.payment_date.isoformat(),
            "transaction_reference": row.PaymentTransaction.transaction_reference,
            "reconciliation_status": row.PaymentTransaction.reconciliation_status,
        }
        for row in recent_tx_rows
    ]

    # 8. Overdue Highlights (Top 5 urgent overdue items)
    overdue_list_stmt = (
        select(FeeInstallment, Student)
        .join(Student, FeeInstallment.student_id == Student.id)
        .where(
            and_(
                FeeInstallment.due_date < today,
                FeeInstallment.amount_paid < FeeInstallment.amount_due,
            )
        )
        .order_by(FeeInstallment.due_date.asc())
        .limit(5)
    )
    overdue_list_rows = (await db.execute(overdue_list_stmt)).all()
    overdue_highlights = [
        OverdueHighlight(
            installment_id=row.FeeInstallment.id,
            student_id=row.Student.id,
            student_name=row.Student.name,
            student_email=row.Student.email,
            title=row.FeeInstallment.title,
            amount_due=row.FeeInstallment.amount_due,
            amount_paid=row.FeeInstallment.amount_paid,
            outstanding_balance=row.FeeInstallment.amount_due - row.FeeInstallment.amount_paid,
            due_date=row.FeeInstallment.due_date,
            days_overdue=(today - row.FeeInstallment.due_date).days,
        )
        for row in overdue_list_rows
    ]

    return FinanceOverviewResponse(
        total_collected=total_collected,
        total_pending=total_pending,
        overdue_amount=overdue_amount,
        overdue_count=overdue_count,
        upcoming_amount=upcoming_amount,
        upcoming_count=upcoming_count,
        total_course_fees=total_course_fees,
        collection_rate=collection_rate,
        period=period,
        start_date=p_start,
        end_date=p_end,
        recent_collections=recent_collections,
        overdue_highlights=overdue_highlights,
        reconciliation_summary=rec_summary,
        payment_methods_breakdown=methods_breakdown,
    )


# ===========================================================================
# 2. Fees & EMIs Directory
# ===========================================================================

@router.get("/fees", response_model=FeeInstallmentsListResponse)
async def list_fees_and_emis(
    search: Optional[str] = Query(None, description="Search candidate name, email, or fee title"),
    status: Optional[str] = Query(None, description="all, Paid, Partially Paid, Upcoming, Overdue, Pending"),
    batch_id: Optional[uuid.UUID] = Query(None),
    due_from: Optional[date] = Query(None),
    due_to: Optional[date] = Query(None),
    sort_by: str = Query("due_date", description="due_date, outstanding_balance"),
    sort_order: str = Query("asc", description="asc, desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Searchable, filterable directory of student fee installments and EMIs.
    """
    today = date.today()
    stmt = (
        select(FeeInstallment, Student, Batch, Course)
        .join(Student, FeeInstallment.student_id == Student.id)
        .outerjoin(Batch, FeeInstallment.batch_id == Batch.id)
        .outerjoin(Course, Batch.course_id == Course.id)
    )

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Student.name).like(term),
                func.lower(Student.email).like(term),
                func.lower(FeeInstallment.title).like(term),
            )
        )

    if batch_id:
        stmt = stmt.where(FeeInstallment.batch_id == batch_id)

    if due_from:
        stmt = stmt.where(FeeInstallment.due_date >= due_from)
    if due_to:
        stmt = stmt.where(FeeInstallment.due_date <= due_to)

    # Status filter logic
    if status and status.lower() != "all":
        st_lower = status.lower()
        if st_lower == "overdue":
            stmt = stmt.where(
                and_(
                    FeeInstallment.due_date < today,
                    FeeInstallment.amount_paid < FeeInstallment.amount_due,
                )
            )
        elif st_lower == "upcoming":
            stmt = stmt.where(
                and_(
                    FeeInstallment.due_date >= today,
                    FeeInstallment.due_date <= today + timedelta(days=7),
                    FeeInstallment.amount_paid < FeeInstallment.amount_due,
                )
            )
        elif st_lower == "paid":
            stmt = stmt.where(FeeInstallment.amount_paid >= FeeInstallment.amount_due)
        elif st_lower == "partially paid" or st_lower == "partially_paid":
            stmt = stmt.where(
                and_(
                    FeeInstallment.amount_paid > Decimal("0.00"),
                    FeeInstallment.amount_paid < FeeInstallment.amount_due,
                )
            )
        elif st_lower == "pending":
            stmt = stmt.where(
                and_(
                    FeeInstallment.amount_paid == Decimal("0.00"),
                    FeeInstallment.due_date >= today,
                )
            )

    # Sorting
    if sort_by in ["outstanding_balance", "balance_due"]:
        order_col = FeeInstallment.amount_due - FeeInstallment.amount_paid
    else:
        order_col = FeeInstallment.due_date

    if sort_order.lower() == "desc":
        stmt = stmt.order_by(order_col.desc())
    else:
        stmt = stmt.order_by(order_col.asc())

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_count = (await db.execute(count_stmt)).scalar() or 0

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    rows = (await db.execute(stmt)).all()

    items: List[FeeInstallmentRow] = []
    for r in rows:
        inst: FeeInstallment = r[0]
        stu: Student = r[1]
        bat: Optional[Batch] = r[2]
        crs: Optional[Course] = r[3]

        outstanding = max(Decimal("0.00"), inst.amount_due - inst.amount_paid)
        is_overdue = inst.due_date < today and outstanding > Decimal("0.00")
        days_overdue = (today - inst.due_date).days if is_overdue else 0
        is_upcoming = today <= inst.due_date <= (today + timedelta(days=7)) and outstanding > Decimal("0.00")

        # Computed status string
        if inst.amount_paid >= inst.amount_due:
            computed_status = "Paid"
        elif is_overdue:
            computed_status = "Overdue"
        elif inst.amount_paid > Decimal("0.00"):
            computed_status = "Partially Paid"
        elif is_upcoming:
            computed_status = "Upcoming"
        else:
            computed_status = "Pending"

        items.append(
            FeeInstallmentRow(
                id=inst.id,
                student_id=stu.id,
                student_name=stu.name,
                student_email=stu.email,
                student_phone=stu.phone,
                student_code=stu.email,
                batch_id=bat.id if bat else None,
                batch_name=bat.code if bat else None,
                course_title=crs.title if crs else "Program Fee",
                course_name=crs.title if crs else "Program Fee",
                title=inst.title,
                total_course_fee=crs.base_fee if crs and hasattr(crs, "base_fee") else inst.amount_due,
                amount_due=inst.amount_due,
                amount_paid=inst.amount_paid,
                outstanding_balance=outstanding,
                balance_due=outstanding,
                due_date=inst.due_date,
                paid_date=inst.paid_date,
                last_payment_date=inst.paid_date,
                status=computed_status,
                receipt_number=inst.receipt_number,
                is_overdue=is_overdue,
                days_overdue=days_overdue,
                is_upcoming=is_upcoming,
                notes=inst.notes,
            )
        )

    return FeeInstallmentsListResponse(
        items=items,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=max(1, (total_count + page_size - 1) // page_size),
    )


# ===========================================================================
# 3. Student Quick List (for Payment modal selector)
# ===========================================================================

@router.get("/students", response_model=List[Dict[str, Any]])
async def list_students_for_payment(
    db: AsyncSession = Depends(get_db),
):
    """
    List enrolled students along with their pending installments for easy payment entry.
    """
    stmt = (
        select(Student)
        .options(
            selectinload(Student.fee_installments),
        )
        .order_by(Student.name.asc())
    )
    students = (await db.execute(stmt)).scalars().all()

    results = []
    for s in students:
        unpaid_installments = [
            {
                "id": str(i.id),
                "title": i.title,
                "amount_due": float(i.amount_due),
                "amount_paid": float(i.amount_paid),
                "outstanding_balance": float(max(Decimal("0.00"), i.amount_due - i.amount_paid)),
                "balance_due": float(max(Decimal("0.00"), i.amount_due - i.amount_paid)),
                "due_date": i.due_date.isoformat(),
            }
            for i in s.fee_installments
            if i.amount_paid < i.amount_due
        ]
        total_unpaid = sum(item["balance_due"] for item in unpaid_installments)
        results.append(
            {
                "id": str(s.id),
                "name": s.name,
                "email": s.email,
                "phone": s.phone,
                "student_id": s.email,
                "course_name": "Enrolled Course",
                "total_unpaid": total_unpaid,
                "pending_installments": unpaid_installments,
                "unpaid_installments": unpaid_installments,
            }
        )
    return results


# ===========================================================================
# 4. Payment Records & Recording
# ===========================================================================

@router.get("/payments", response_model=PaymentTransactionsListResponse)
async def list_payment_records(
    search: Optional[str] = Query(None, description="Search student, receipt, or reference"),
    payment_method: Optional[str] = Query(None, description="UPI, Bank Transfer, Cash, Card"),
    reconciliation_status: Optional[str] = Query(None, description="Unreconciled, Reconciled, Discrepancy"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Searchable and filterable payment transaction history.
    Enables accountant staff to audit receipts, search across students,
    and filter by reconciliation state and date ranges.
    """
    # ── 1. Base Query Construction ──────────────────────────────────────────
    # Join PaymentTransaction with Student (required) and FeeInstallment (outer join,
    # as some payments may be general advance credits or registration fees).
    stmt = (
        select(PaymentTransaction, Student, FeeInstallment)
        .join(Student, PaymentTransaction.student_id == Student.id)
        .outerjoin(FeeInstallment, PaymentTransaction.installment_id == FeeInstallment.id)
    )

    # ── 2. Dynamic Text Search ──────────────────────────────────────────────
    # Supports partial substring matching across student name, student email,
    # official receipt number, and bank/UPI reference numbers.
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Student.name).like(term),
                func.lower(Student.email).like(term),
                func.lower(PaymentTransaction.receipt_number).like(term),
                func.lower(PaymentTransaction.transaction_reference).like(term),
            )
        )

    # ── 3. Payment Method & Reconciliation Filters ──────────────────────────
    # Normalize input strings to match stored casing (e.g. 'upi' vs 'UPI', 'bank_transfer')
    if payment_method and payment_method.strip().lower() != "all":
        pm_clean = payment_method.strip().lower().replace("_", " ")
        stmt = stmt.where(
            or_(
                func.lower(PaymentTransaction.payment_method) == pm_clean,
                func.lower(PaymentTransaction.payment_method) == payment_method.strip().lower(),
            )
        )

    if reconciliation_status and reconciliation_status.strip().lower() != "all":
        stmt = stmt.where(func.lower(PaymentTransaction.reconciliation_status) == reconciliation_status.strip().lower())

    # ── 4. Date Range Filters ───────────────────────────────────────────────
    if start_date:
        stmt = stmt.where(PaymentTransaction.payment_date >= start_date)
    if end_date:
        stmt = stmt.where(PaymentTransaction.payment_date <= end_date)

    # Sort in reverse chronological order so recent transactions appear first
    stmt = stmt.order_by(PaymentTransaction.payment_date.desc(), PaymentTransaction.created_at.desc())

    # ── 5. Efficient Total Count Subquery ────────────────────────────────────
    # Computes the total matching records before applying pagination limit/offset
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_count = (await db.execute(count_stmt)).scalar() or 0

    # ── 6. Paginated Result Retrieval ────────────────────────────────────────
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    rows = (await db.execute(stmt)).all()

    # ── 7. Response DTO Serialization ────────────────────────────────────────
    # Maps SQLAlchemy tuple rows into typed Pydantic response models
    items: List[PaymentTransactionResponse] = []
    for r in rows:
        tx: PaymentTransaction = r[0]
        stu: Student = r[1]
        inst: Optional[FeeInstallment] = r[2]

        items.append(
            PaymentTransactionResponse(
                id=tx.id,
                installment_id=tx.installment_id,
                installment_title=inst.title if inst else None,
                installment_number=None,
                course_name="Enrolled Course",
                student_id=stu.id,
                student_name=stu.name,
                student_email=stu.email,
                student_code=stu.email,
                amount=tx.amount,
                payment_date=tx.payment_date,
                payment_method=tx.payment_method,
                transaction_reference=tx.transaction_reference,
                receipt_number=tx.receipt_number,
                payment_status=tx.payment_status,
                reconciliation_status=tx.reconciliation_status,
                reconciled_by=tx.reconciled_by,
                reconciled_at=tx.reconciled_at,
                discrepancy_reason=tx.discrepancy_reason,
                recorded_by=tx.recorded_by,
                notes=tx.notes,
                created_at=tx.created_at,
            )
        )

    # Return paginated response payload with metadata

    return PaymentTransactionsListResponse(
        items=items,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=max(1, (total_count + page_size - 1) // page_size),
    )


@router.post("/payments", response_model=PaymentTransactionResponse, status_code=status.HTTP_201_CREATED)
async def record_payment(
    payload: RecordPaymentRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Record a student fee payment. Atomically updates installment balance and status,
    prevents overpayment and duplicate transaction references.
    """
    accountant_email = current_user.get("id", "accounts@edupilot.io").lower()

    # 1. Verify student exists
    student = await db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID '{payload.student_id}' not found.",
        )

    # 2. Prevent duplicate transaction reference
    tx_ref = (payload.transaction_reference or "").strip()
    if not tx_ref:
        tx_ref = f"CASH-{uuid.uuid4().hex[:8].upper()}" if payload.payment_method == "Cash" else f"TXN-{uuid.uuid4().hex[:8].upper()}"

    ref_check = await db.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.transaction_reference == tx_ref
        )
    )
    if ref_check.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A transaction with reference '{tx_ref}' has already been recorded.",
        )

    # 3. If installment provided, validate and update in same atomic transaction
    installment = None
    if payload.installment_id:
        installment = await db.get(FeeInstallment, payload.installment_id)
        if not installment or installment.student_id != payload.student_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected installment does not belong to this student.",
            )

        remaining_balance = installment.amount_due - installment.amount_paid
        if payload.amount > remaining_balance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment amount (₹{payload.amount}) exceeds remaining balance (₹{remaining_balance}).",
            )

        installment.amount_paid += payload.amount
        installment.paid_date = payload.payment_date or date.today()
        if installment.amount_paid >= installment.amount_due:
            installment.status = FeeStatus.PAID
        else:
            installment.status = FeeStatus.PARTIALLY_PAID

    # 4. Generate unique sequential receipt number
    receipt_no = f"REC-{date.today().year}-{uuid.uuid4().hex[:6].upper()}"

    tx = PaymentTransaction(
        installment_id=payload.installment_id,
        student_id=payload.student_id,
        amount=payload.amount,
        payment_date=payload.payment_date or date.today(),
        payment_method=payload.payment_method,
        transaction_reference=tx_ref,
        receipt_number=receipt_no,
        payment_status="Successful",
        reconciliation_status="Unreconciled",
        recorded_by=accountant_email,
        notes=payload.notes.strip() if payload.notes else None,
    )
    db.add(tx)

    if installment:
        installment.receipt_number = receipt_no

    await db.commit()
    await db.refresh(tx)

    return PaymentTransactionResponse(
        id=tx.id,
        installment_id=tx.installment_id,
        installment_title=installment.title if installment else None,
        installment_number=None,
        course_name="Enrolled Course",
        student_id=student.id,
        student_name=student.name,
        student_email=student.email,
        student_code=student.email,
        amount=tx.amount,
        payment_date=tx.payment_date,
        payment_method=tx.payment_method,
        transaction_reference=tx.transaction_reference,
        receipt_number=tx.receipt_number,
        payment_status=tx.payment_status,
        reconciliation_status=tx.reconciliation_status,
        reconciled_by=tx.reconciled_by,
        reconciled_at=tx.reconciled_at,
        discrepancy_reason=tx.discrepancy_reason,
        recorded_by=tx.recorded_by,
        notes=tx.notes,
        created_at=tx.created_at,
    )


@router.get("/payments/{payment_id}/receipt", response_model=ReceiptDetailsResponse)
async def get_payment_receipt(
    payment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch comprehensive receipt details for printing or verification.
    """
    stmt = (
        select(PaymentTransaction, Student, FeeInstallment, Batch, Course)
        .join(Student, PaymentTransaction.student_id == Student.id)
        .outerjoin(FeeInstallment, PaymentTransaction.installment_id == FeeInstallment.id)
        .outerjoin(Batch, FeeInstallment.batch_id == Batch.id)
        .outerjoin(Course, Batch.course_id == Course.id)
        .where(PaymentTransaction.id == payment_id)
    )
    res = (await db.execute(stmt)).first()
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found.")

    tx, stu, inst, bat, crs = res[0], res[1], res[2], res[3], res[4]

    rem_bal = max(Decimal("0.00"), inst.amount_due - inst.amount_paid) if inst else Decimal("0.00")
    total_fee = crs.base_fee if crs and hasattr(crs, "base_fee") else (inst.amount_due if inst else tx.amount)

    return ReceiptDetailsResponse(
        receipt_number=tx.receipt_number,
        transaction_reference=tx.transaction_reference,
        payment_date=tx.payment_date,
        amount_paid=tx.amount,
        payment_method=tx.payment_method,
        payment_status=tx.payment_status,
        reconciliation_status=tx.reconciliation_status,
        recorded_by=tx.recorded_by,
        notes=tx.notes,
        student_name=stu.name,
        student_code=stu.email,
        student_email=stu.email,
        course_name=crs.title if crs else "Institute Programme",
        total_course_fee=total_fee,
        installment_number=None,
        installment_balance_remaining=rem_bal,
        student={
            "id": str(stu.id),
            "name": stu.name,
            "email": stu.email,
            "phone": stu.phone,
        },
        installment={
            "id": str(inst.id) if inst else None,
            "title": inst.title if inst else "Ad-hoc Payment",
            "amount_due": str(inst.amount_due) if inst else str(tx.amount),
            "amount_paid": str(inst.amount_paid) if inst else str(tx.amount),
            "remaining_balance": str(rem_bal),
        } if inst else None,
        course_title=crs.title if crs else "Institute Programme",
        batch_name=bat.code if bat else "General",
        institute={
            "name": "EduPilot Institute of Operations & Technology",
            "address": "Academic Complex, Silicon Hub, Knowledge Corridor",
            "contact": "finance@edupilot.io | +91 80 4920 1100",
            "tax_id": "GSTIN29AABCE1234F1Z5",
        },
    )


# ===========================================================================
# 5. Payment Reconciliation
# ===========================================================================

@router.get("/reconciliation/summary", response_model=ReconciliationSummary)
async def get_reconciliation_summary(
    db: AsyncSession = Depends(get_db),
):
    """
    Summary breakdown of Reconciled, Unreconciled, and Discrepancy transactions.
    """
    stmt = select(
        PaymentTransaction.reconciliation_status,
        func.count(PaymentTransaction.id),
        func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00")),
    ).where(
        PaymentTransaction.payment_status == "Successful"
    ).group_by(PaymentTransaction.reconciliation_status)

    rows = (await db.execute(stmt)).all()
    summary = ReconciliationSummary()
    for row in rows:
        st, cnt, amt = row[0], row[1], row[2]
        if st == "Reconciled":
            summary.reconciled_count = cnt
            summary.reconciled_amount = amt
        elif st == "Unreconciled":
            summary.unreconciled_count = cnt
            summary.unreconciled_amount = amt
        elif st == "Discrepancy":
            summary.discrepancy_count = cnt
            summary.discrepancy_amount = amt
        summary.total_count += cnt
        summary.total_amount += amt

    return summary


@router.post("/reconciliation/{payment_id}/reconcile", response_model=PaymentTransactionResponse)
async def reconcile_transaction(
    payment_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a payment transaction as verified and reconciled against bank or gateway credit.
    """
    accountant_email = current_user.get("id", "accounts@edupilot.io").lower()
    tx = await db.get(PaymentTransaction, payment_id)
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment transaction not found.")

    tx.reconciliation_status = "Reconciled"
    tx.reconciled_by = accountant_email
    tx.reconciled_at = datetime.now(timezone.utc)
    tx.discrepancy_reason = None

    await db.commit()
    await db.refresh(tx)

    # Fetch student for response
    student = await db.get(Student, tx.student_id)
    return PaymentTransactionResponse(
        id=tx.id,
        installment_id=tx.installment_id,
        installment_title=None,
        student_id=student.id if student else tx.student_id,
        student_name=student.name if student else "Candidate",
        student_email=student.email if student else "email@example.com",
        amount=tx.amount,
        payment_date=tx.payment_date,
        payment_method=tx.payment_method,
        transaction_reference=tx.transaction_reference,
        receipt_number=tx.receipt_number,
        payment_status=tx.payment_status,
        reconciliation_status=tx.reconciliation_status,
        reconciled_by=tx.reconciled_by,
        reconciled_at=tx.reconciled_at,
        discrepancy_reason=tx.discrepancy_reason,
        recorded_by=tx.recorded_by,
        notes=tx.notes,
        created_at=tx.created_at,
    )


@router.post("/reconciliation/{payment_id}/flag-discrepancy", response_model=PaymentTransactionResponse)
async def flag_reconciliation_discrepancy(
    payment_id: uuid.UUID,
    payload: FlagDiscrepancyRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Flag a payment with an audit reason for discrepancy review.
    """
    accountant_email = current_user.get("id", "accounts@edupilot.io").lower()
    tx = await db.get(PaymentTransaction, payment_id)
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment transaction not found.")

    tx.reconciliation_status = "Discrepancy"
    tx.discrepancy_reason = payload.reason.strip()
    tx.reconciled_by = accountant_email
    tx.reconciled_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(tx)

    student = await db.get(Student, tx.student_id)
    return PaymentTransactionResponse(
        id=tx.id,
        installment_id=tx.installment_id,
        installment_title=None,
        student_id=student.id if student else tx.student_id,
        student_name=student.name if student else "Candidate",
        student_email=student.email if student else "email@example.com",
        amount=tx.amount,
        payment_date=tx.payment_date,
        payment_method=tx.payment_method,
        transaction_reference=tx.transaction_reference,
        receipt_number=tx.receipt_number,
        payment_status=tx.payment_status,
        reconciliation_status=tx.reconciliation_status,
        reconciled_by=tx.reconciled_by,
        reconciled_at=tx.reconciled_at,
        discrepancy_reason=tx.discrepancy_reason,
        recorded_by=tx.recorded_by,
        notes=tx.notes,
        created_at=tx.created_at,
    )


# ===========================================================================
# 6. Financial Reports & CSV Exports
# ===========================================================================

@router.get("/reports/{report_type}", response_model=Dict[str, Any])
async def get_financial_report(
    report_type: str,
    period: str = Query("this_month"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    batch_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate structured financial reports:
    - fee_collection
    - outstanding_fees
    - overdue_emis
    - upcoming_dues
    - reconciliation
    """
    today = date.today()
    p_start, p_end = _get_period_bounds(period, start_date, end_date)

    if report_type == "fee_collection":
        # Aggregate by payment_date
        daily_stmt = select(
            PaymentTransaction.payment_date,
            func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00")),
        ).where(
            and_(
                PaymentTransaction.payment_status == "Successful",
                PaymentTransaction.payment_date >= p_start,
                PaymentTransaction.payment_date <= p_end,
            )
        ).group_by(PaymentTransaction.payment_date).order_by(PaymentTransaction.payment_date.asc())
        daily_rows = (await db.execute(daily_stmt)).all()

        methods_stmt = select(
            PaymentTransaction.payment_method,
            func.count(PaymentTransaction.id),
            func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00")),
        ).where(
            and_(
                PaymentTransaction.payment_status == "Successful",
                PaymentTransaction.payment_date >= p_start,
                PaymentTransaction.payment_date <= p_end,
            )
        ).group_by(PaymentTransaction.payment_method)
        method_rows = (await db.execute(methods_stmt)).all()

        total_collected = sum([r[1] for r in daily_rows], Decimal("0.00"))
        tx_count = sum([r[1] for r in method_rows])

        return {
            "report_type": "fee_collection",
            "period_start": p_start.isoformat(),
            "period_end": p_end.isoformat(),
            "total_collected": str(total_collected),
            "transaction_count": tx_count,
            "daily_aggregates": [
                {"date": r[0].isoformat(), "amount": str(r[1])} for r in daily_rows
            ],
            "method_breakdown": [
                {"method": r[0], "count": r[1], "amount": str(r[2])} for r in method_rows
            ],
        }

    elif report_type == "outstanding_fees":
        stmt = (
            select(
                Student.id,
                Student.name,
                Student.email,
                func.coalesce(Course.title, "Institute Programme"),
                func.coalesce(func.sum(FeeInstallment.amount_due), Decimal("0.00")),
                func.coalesce(func.sum(FeeInstallment.amount_paid), Decimal("0.00")),
            )
            .join(FeeInstallment, Student.id == FeeInstallment.student_id)
            .outerjoin(Batch, FeeInstallment.batch_id == Batch.id)
            .outerjoin(Course, Batch.course_id == Course.id)
            .group_by(Student.id, Student.name, Student.email, Course.title)
            .having(func.sum(FeeInstallment.amount_due) > func.sum(FeeInstallment.amount_paid))
            .order_by(func.sum(FeeInstallment.amount_due - FeeInstallment.amount_paid).desc())
        )
        rows = (await db.execute(stmt)).all()

        students_out = []
        total_outstanding = Decimal("0.00")
        for r in rows:
            due = r[4]
            paid = r[5]
            out = due - paid
            total_outstanding += out
            students_out.append(
                {
                    "student_id": str(r[0]),
                    "student_name": r[1],
                    "student_email": r[2],
                    "course_title": r[3],
                    "total_due": str(due),
                    "total_paid": str(paid),
                    "outstanding_balance": str(out),
                }
            )

        return {
            "report_type": "outstanding_fees",
            "total_outstanding": str(total_outstanding),
            "student_count": len(students_out),
            "students": students_out,
        }

    elif report_type == "overdue_emis":
        stmt = (
            select(FeeInstallment, Student, Course)
            .join(Student, FeeInstallment.student_id == Student.id)
            .outerjoin(Batch, FeeInstallment.batch_id == Batch.id)
            .outerjoin(Course, Batch.course_id == Course.id)
            .where(
                and_(
                    FeeInstallment.due_date < today,
                    FeeInstallment.amount_paid < FeeInstallment.amount_due,
                )
            )
            .order_by(FeeInstallment.due_date.asc())
        )
        rows = (await db.execute(stmt)).all()

        total_overdue = Decimal("0.00")
        items = []
        for r in rows:
            inst: FeeInstallment = r[0]
            stu: Student = r[1]
            crs: Optional[Course] = r[2]
            overdue_bal = inst.amount_due - inst.amount_paid
            total_overdue += overdue_bal
            items.append(
                {
                    "installment_id": str(inst.id),
                    "student_id": str(stu.id),
                    "student_name": stu.name,
                    "student_email": stu.email,
                    "student_phone": stu.phone,
                    "installment_title": inst.title,
                    "course_title": crs.title if crs else "Institute Programme",
                    "amount_due": str(inst.amount_due),
                    "amount_paid": str(inst.amount_paid),
                    "overdue_amount": str(overdue_bal),
                    "due_date": inst.due_date.isoformat(),
                    "days_overdue": (today - inst.due_date).days,
                }
            )

        return {
            "report_type": "overdue_emis",
            "total_overdue": str(total_overdue),
            "overdue_count": len(items),
            "items": items,
        }

    elif report_type == "upcoming_dues":
        end_upcoming = today + timedelta(days=14)
        stmt = (
            select(FeeInstallment, Student, Course)
            .join(Student, FeeInstallment.student_id == Student.id)
            .outerjoin(Batch, FeeInstallment.batch_id == Batch.id)
            .outerjoin(Course, Batch.course_id == Course.id)
            .where(
                and_(
                    FeeInstallment.due_date >= today,
                    FeeInstallment.due_date <= end_upcoming,
                    FeeInstallment.amount_paid < FeeInstallment.amount_due,
                )
            )
            .order_by(FeeInstallment.due_date.asc())
        )
        rows = (await db.execute(stmt)).all()

        total_upcoming = Decimal("0.00")
        items = []
        for r in rows:
            inst: FeeInstallment = r[0]
            stu: Student = r[1]
            crs: Optional[Course] = r[2]
            exp = inst.amount_due - inst.amount_paid
            total_upcoming += exp
            items.append(
                {
                    "installment_id": str(inst.id),
                    "student_id": str(stu.id),
                    "student_name": stu.name,
                    "student_email": stu.email,
                    "installment_title": inst.title,
                    "course_title": crs.title if crs else "Institute Programme",
                    "amount_due": str(inst.amount_due),
                    "amount_paid": str(inst.amount_paid),
                    "expected_amount": str(exp),
                    "due_date": inst.due_date.isoformat(),
                    "days_until_due": (inst.due_date - today).days,
                }
            )

        return {
            "report_type": "upcoming_dues",
            "total_upcoming": str(total_upcoming),
            "upcoming_count": len(items),
            "items": items,
        }

    elif report_type == "reconciliation":
        stmt = select(
            PaymentTransaction.reconciliation_status,
            func.count(PaymentTransaction.id),
            func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00")),
        ).where(
            PaymentTransaction.payment_status == "Successful"
        ).group_by(PaymentTransaction.reconciliation_status)

        rows = (await db.execute(stmt)).all()

        # Discrepancies details
        disc_stmt = (
            select(PaymentTransaction, Student)
            .join(Student, PaymentTransaction.student_id == Student.id)
            .where(PaymentTransaction.reconciliation_status == "Discrepancy")
            .order_by(PaymentTransaction.payment_date.desc())
        )
        disc_rows = (await db.execute(disc_stmt)).all()

        disc_items = [
            {
                "id": str(r[0].id),
                "receipt_number": r[0].receipt_number,
                "student_name": r[1].name,
                "amount": str(r[0].amount),
                "payment_method": r[0].payment_method,
                "transaction_reference": r[0].transaction_reference,
                "discrepancy_reason": r[0].discrepancy_reason,
                "payment_date": r[0].payment_date.isoformat(),
            }
            for r in disc_rows
        ]

        summary_data = {r[0]: {"count": r[1], "amount": str(r[2])} for r in rows}

        return {
            "report_type": "reconciliation",
            "summary": summary_data,
            "discrepancies": disc_items,
        }

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown report type: '{report_type}'. Supported: fee_collection, outstanding_fees, overdue_emis, upcoming_dues, reconciliation.",
        )


@router.get("/reports/{report_type}/export")
async def export_financial_report_csv(
    report_type: str,
    period: str = Query("this_month"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream financial report as a clean CSV file download.
    """
    today = date.today()
    p_start, p_end = _get_period_bounds(period, start_date, end_date)

    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "fee_collection":
        writer.writerow(["Payment Date", "Receipt #", "Transaction Ref", "Student Name", "Student Email", "Payment Method", "Amount (INR)", "Reconciliation Status"])
        stmt = (
            select(PaymentTransaction, Student)
            .join(Student, PaymentTransaction.student_id == Student.id)
            .where(
                and_(
                    PaymentTransaction.payment_status == "Successful",
                    PaymentTransaction.payment_date >= p_start,
                    PaymentTransaction.payment_date <= p_end,
                )
            )
            .order_by(PaymentTransaction.payment_date.desc())
        )
        rows = (await db.execute(stmt)).all()
        for r in rows:
            tx, stu = r[0], r[1]
            writer.writerow([
                tx.payment_date.isoformat(),
                tx.receipt_number,
                tx.transaction_reference,
                stu.name,
                stu.email,
                tx.payment_method,
                str(tx.amount),
                tx.reconciliation_status,
            ])

    elif report_type == "outstanding_fees":
        writer.writerow(["Student Name", "Student Email", "Program Title", "Total Due (INR)", "Total Paid (INR)", "Outstanding Balance (INR)"])
        stmt = (
            select(
                Student.name,
                Student.email,
                func.coalesce(Course.title, "Institute Programme"),
                func.coalesce(func.sum(FeeInstallment.amount_due), Decimal("0.00")),
                func.coalesce(func.sum(FeeInstallment.amount_paid), Decimal("0.00")),
            )
            .join(FeeInstallment, Student.id == FeeInstallment.student_id)
            .outerjoin(Batch, FeeInstallment.batch_id == Batch.id)
            .outerjoin(Course, Batch.course_id == Course.id)
            .group_by(Student.name, Student.email, Course.title)
            .having(func.sum(FeeInstallment.amount_due) > func.sum(FeeInstallment.amount_paid))
            .order_by(func.sum(FeeInstallment.amount_due - FeeInstallment.amount_paid).desc())
        )
        rows = (await db.execute(stmt)).all()
        for r in rows:
            due, paid = r[3], r[4]
            out = due - paid
            writer.writerow([r[0], r[1], r[2], str(due), str(paid), str(out)])

    elif report_type == "overdue_emis":
        writer.writerow(["Student Name", "Student Email", "Student Phone", "Installment Title", "Due Date", "Days Overdue", "Amount Due (INR)", "Amount Paid (INR)", "Overdue Amount (INR)"])
        stmt = (
            select(FeeInstallment, Student)
            .join(Student, FeeInstallment.student_id == Student.id)
            .where(
                and_(
                    FeeInstallment.due_date < today,
                    FeeInstallment.amount_paid < FeeInstallment.amount_due,
                )
            )
            .order_by(FeeInstallment.due_date.asc())
        )
        rows = (await db.execute(stmt)).all()
        for r in rows:
            inst, stu = r[0], r[1]
            writer.writerow([
                stu.name,
                stu.email,
                stu.phone or "N/A",
                inst.title,
                inst.due_date.isoformat(),
                (today - inst.due_date).days,
                str(inst.amount_due),
                str(inst.amount_paid),
                str(inst.amount_due - inst.amount_paid),
            ])

    elif report_type == "upcoming_dues":
        writer.writerow(["Student Name", "Student Email", "Installment Title", "Due Date", "Days Until Due", "Amount Due (INR)", "Amount Paid (INR)", "Expected Amount (INR)"])
        stmt = (
            select(FeeInstallment, Student)
            .join(Student, FeeInstallment.student_id == Student.id)
            .where(
                and_(
                    FeeInstallment.due_date >= today,
                    FeeInstallment.due_date <= today + timedelta(days=14),
                    FeeInstallment.amount_paid < FeeInstallment.amount_due,
                )
            )
            .order_by(FeeInstallment.due_date.asc())
        )
        rows = (await db.execute(stmt)).all()
        for r in rows:
            inst, stu = r[0], r[1]
            writer.writerow([
                stu.name,
                stu.email,
                inst.title,
                inst.due_date.isoformat(),
                (inst.due_date - today).days,
                str(inst.amount_due),
                str(inst.amount_paid),
                str(inst.amount_due - inst.amount_paid),
            ])

    elif report_type == "reconciliation":
        writer.writerow(["Receipt #", "Transaction Ref", "Student Name", "Payment Date", "Payment Method", "Amount (INR)", "Reconciliation Status", "Reconciled By", "Discrepancy Reason"])
        stmt = (
            select(PaymentTransaction, Student)
            .join(Student, PaymentTransaction.student_id == Student.id)
            .order_by(PaymentTransaction.payment_date.desc())
        )
        rows = (await db.execute(stmt)).all()
        for r in rows:
            tx, stu = r[0], r[1]
            writer.writerow([
                tx.receipt_number,
                tx.transaction_reference,
                stu.name,
                tx.payment_date.isoformat(),
                tx.payment_method,
                str(tx.amount),
                tx.reconciliation_status,
                tx.reconciled_by or "N/A",
                tx.discrepancy_reason or "N/A",
            ])
    else:
        raise HTTPException(status_code=400, detail="Invalid report type for export.")

    filename = f"{report_type}_{today.strftime('%Y%m%d')}.csv"
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
