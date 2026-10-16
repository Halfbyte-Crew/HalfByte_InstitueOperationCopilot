from datetime import date
from decimal import Decimal
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import require_roles
from app.database.session import get_db
from app.models.institute import Batch, FeeInstallment, FeeStatus, Student
from app.schemas.institute import (
    FeeInstallmentCreate,
    FeeInstallmentResponse,
    FeeInstallmentUpdate,
    FeeOverviewResponse,
    FeePaymentRecord,
)

# Strict RBAC enforcement: Only super_admin, admin, and finance can access fee operations
router = APIRouter(
    prefix="/fees",
    tags=["Fees & Financials"],
    dependencies=[Depends(require_roles(["super_admin", "admin", "finance"]))],
)


@router.post("", response_model=FeeInstallmentResponse, status_code=status.HTTP_201_CREATED)
async def create_fee_installment(
    payload: FeeInstallmentCreate,
    db: AsyncSession = Depends(get_db),
):
    student = await db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id '{payload.student_id}' not found.",
        )

    if payload.batch_id:
        batch = await db.get(Batch, payload.batch_id)
        if not batch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Batch with id '{payload.batch_id}' not found.",
            )

    installment = FeeInstallment(**payload.model_dump())
    db.add(installment)
    await db.commit()
    await db.refresh(installment)
    return installment


@router.get("", response_model=List[FeeInstallmentResponse])
async def list_fee_installments(
    student_id: Optional[uuid.UUID] = Query(None),
    batch_id: Optional[uuid.UUID] = Query(None),
    status: Optional[FeeStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(FeeInstallment)
    if student_id:
        stmt = stmt.where(FeeInstallment.student_id == student_id)
    if batch_id:
        stmt = stmt.where(FeeInstallment.batch_id == batch_id)
    if status:
        stmt = stmt.where(FeeInstallment.status == status)

    stmt = stmt.order_by(FeeInstallment.due_date.asc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/overview", response_model=FeeOverviewResponse)
async def get_fee_overview(db: AsyncSession = Depends(get_db)):
    due_res = await db.execute(select(func.coalesce(func.sum(FeeInstallment.amount_due), Decimal("0.00"))))
    paid_res = await db.execute(select(func.coalesce(func.sum(FeeInstallment.amount_paid), Decimal("0.00"))))

    total_receivable = due_res.scalar() or Decimal("0.00")
    total_collected = paid_res.scalar() or Decimal("0.00")
    total_outstanding = max(Decimal("0.00"), total_receivable - total_collected)

    rate = (
        f"{(total_collected / total_receivable * 100):.1f}%"
        if total_receivable > Decimal("0.00")
        else "0.0%"
    )

    return FeeOverviewResponse(
        total_receivable=total_receivable,
        total_collected=total_collected,
        total_outstanding=total_outstanding,
        collection_rate=rate,
    )


@router.post("/{installment_id}/payments", response_model=FeeInstallmentResponse)
async def record_payment(
    installment_id: uuid.UUID,
    payload: FeePaymentRecord,
    db: AsyncSession = Depends(get_db),
):
    installment = await db.get(FeeInstallment, installment_id)
    if not installment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fee installment with id '{installment_id}' not found.",
        )

    new_paid = installment.amount_paid + payload.payment_amount
    if new_paid > installment.amount_due:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment amount ({payload.payment_amount}) exceeds remaining balance ({installment.amount_due - installment.amount_paid}).",
        )

    installment.amount_paid = new_paid
    installment.paid_date = payload.payment_date or date.today()
    if payload.receipt_number:
        installment.receipt_number = payload.receipt_number
    if payload.notes:
        installment.notes = (installment.notes or "") + f" [Payment: {payload.payment_amount}] {payload.notes}"

    if installment.amount_paid == installment.amount_due:
        installment.status = FeeStatus.PAID
    else:
        installment.status = FeeStatus.PARTIALLY_PAID

    await db.commit()
    await db.refresh(installment)
    return installment
