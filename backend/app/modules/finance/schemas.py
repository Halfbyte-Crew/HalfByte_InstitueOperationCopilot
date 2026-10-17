"""
Pydantic schemas for Finance & Accounting Operations.
Decimal-safe financial schemas with strict typing and serialization.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional, Union
import uuid
from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator


# ---------------------------------------------------------------------------
# Overview & Summary Schemas
# ---------------------------------------------------------------------------

class CollectionTrendItem(BaseModel):
    date_str: str
    amount: Decimal


class PaymentMethodSummary(BaseModel):
    method: str
    amount: Decimal
    count: int


class OverdueHighlight(BaseModel):
    installment_id: uuid.UUID
    student_id: uuid.UUID
    student_name: str
    student_email: str
    title: str
    amount_due: Decimal
    amount_paid: Decimal
    outstanding_balance: Decimal
    due_date: date
    days_overdue: int


class ReconciliationSummary(BaseModel):
    reconciled_count: int = 0
    reconciled_amount: Decimal = Decimal("0.00")
    unreconciled_count: int = 0
    unreconciled_amount: Decimal = Decimal("0.00")
    discrepancy_count: int = 0
    discrepancy_amount: Decimal = Decimal("0.00")
    total_count: int = 0
    total_amount: Decimal = Decimal("0.00")


class FinanceOverviewResponse(BaseModel):
    total_collected: Decimal = Decimal("0.00")
    total_pending: Decimal = Decimal("0.00")
    overdue_amount: Decimal = Decimal("0.00")
    overdue_count: int = 0
    upcoming_amount: Decimal = Decimal("0.00")
    upcoming_count: int = 0
    total_course_fees: Decimal = Decimal("0.00")
    collection_rate: str = "0.0%"
    period: str = "this_month"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    recent_collections: List[Dict[str, Any]] = []
    overdue_highlights: List[OverdueHighlight] = []
    reconciliation_summary: ReconciliationSummary
    payment_methods_breakdown: List[PaymentMethodSummary] = []


# ---------------------------------------------------------------------------
# Fees & EMIs Schemas
# ---------------------------------------------------------------------------

class FeeInstallmentRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    student_id: uuid.UUID
    student_name: str
    student_email: str
    student_phone: Optional[str] = None
    student_code: Optional[str] = None
    batch_id: Optional[uuid.UUID] = None
    batch_name: Optional[str] = None
    course_title: Optional[str] = None
    course_name: Optional[str] = None
    title: str
    installment_number: Optional[int] = None
    total_course_fee: Optional[Decimal] = None
    amount_due: Decimal
    amount_paid: Decimal
    outstanding_balance: Decimal
    balance_due: Optional[Decimal] = None
    due_date: date
    paid_date: Optional[date] = None
    last_payment_date: Optional[date] = None
    status: str
    receipt_number: Optional[str] = None
    is_overdue: bool = False
    days_overdue: int = 0
    is_upcoming: bool = False
    notes: Optional[str] = None


class FeeInstallmentsListResponse(BaseModel):
    items: List[FeeInstallmentRow]
    total: int
    page: int
    page_size: int
    total_pages: int


# ---------------------------------------------------------------------------
# Payment Transactions & Recording Schemas
# ---------------------------------------------------------------------------

class RecordPaymentRequest(BaseModel):
    student_id: uuid.UUID
    installment_id: Optional[uuid.UUID] = None
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    payment_date: Optional[Union[date, str]] = None
    payment_method: str = "UPI"
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("payment_date", mode="before")
    @classmethod
    def normalize_payment_date(cls, v):
        if not v:
            return date.today()
        if isinstance(v, str):
            clean_str = v.split("T")[0].strip()
            return date.fromisoformat(clean_str)
        if isinstance(v, datetime):
            return v.date()
        return v

    @field_validator("payment_method", mode="before")
    @classmethod
    def normalize_payment_method(cls, v):
        if not v:
            return "UPI"
        val = str(v).strip().lower()
        mapping = {
            "upi": "UPI",
            "bank_transfer": "Bank Transfer",
            "bank transfer": "Bank Transfer",
            "cash": "Cash",
            "card": "Card",
        }
        return mapping.get(val, str(v).strip())


class PaymentTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    installment_id: Optional[uuid.UUID] = None
    installment_title: Optional[str] = None
    student_id: uuid.UUID
    student_name: str
    student_email: str
    student_code: Optional[str] = None
    course_name: Optional[str] = None
    installment_number: Optional[int] = None
    amount: Decimal
    payment_date: date
    payment_method: str
    transaction_reference: str
    receipt_number: str
    payment_status: str
    reconciliation_status: str
    reconciled_by: Optional[str] = None
    reconciled_at: Optional[datetime] = None
    discrepancy_reason: Optional[str] = None
    recorded_by: str
    notes: Optional[str] = None
    created_at: datetime


class PaymentTransactionsListResponse(BaseModel):
    items: List[PaymentTransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ReceiptDetailsResponse(BaseModel):
    receipt_number: str
    transaction_reference: str
    payment_date: date
    amount_paid: Decimal
    payment_method: str
    payment_status: str
    reconciliation_status: str
    recorded_by: str
    notes: Optional[str] = None
    student_name: Optional[str] = None
    student_code: Optional[str] = None
    student_email: Optional[str] = None
    course_name: Optional[str] = None
    total_course_fee: Optional[Decimal] = None
    installment_number: Optional[int] = None
    installment_balance_remaining: Optional[Decimal] = None
    student: Dict[str, Any]
    installment: Optional[Dict[str, Any]] = None
    course_title: Optional[str] = None
    batch_name: Optional[str] = None
    institute: Dict[str, Any]


# ---------------------------------------------------------------------------
# Reconciliation Schemas
# ---------------------------------------------------------------------------

class FlagDiscrepancyRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)


# ---------------------------------------------------------------------------
# Financial Reports Schemas
# ---------------------------------------------------------------------------

class ReportPeriodFilter(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    course_id: Optional[uuid.UUID] = None
    batch_id: Optional[uuid.UUID] = None


class FeeCollectionReportData(BaseModel):
    period_start: date
    period_end: date
    total_collected: Decimal
    transaction_count: int
    method_breakdown: List[PaymentMethodSummary]
    daily_aggregates: List[CollectionTrendItem]


class OutstandingFeesReportRow(BaseModel):
    student_id: uuid.UUID
    student_name: str
    student_email: str
    course_title: str
    total_due: Decimal
    total_paid: Decimal
    outstanding_balance: Decimal
    overdue_amount: Decimal


class OutstandingFeesReportData(BaseModel):
    total_outstanding: Decimal
    student_count: int
    students: List[OutstandingFeesReportRow]


class OverdueEMIReportRow(BaseModel):
    student_id: uuid.UUID
    student_name: str
    student_email: str
    student_phone: Optional[str] = None
    installment_id: uuid.UUID
    installment_title: str
    course_title: str
    amount_due: Decimal
    amount_paid: Decimal
    overdue_amount: Decimal
    due_date: date
    days_overdue: int


class OverdueEMIReportData(BaseModel):
    total_overdue: Decimal
    overdue_count: int
    items: List[OverdueEMIReportRow]


class UpcomingDuesReportRow(BaseModel):
    student_id: uuid.UUID
    student_name: str
    student_email: str
    installment_id: uuid.UUID
    installment_title: str
    course_title: str
    amount_due: Decimal
    amount_paid: Decimal
    expected_amount: Decimal
    due_date: date
    days_until_due: int


class UpcomingDuesReportData(BaseModel):
    total_upcoming: Decimal
    upcoming_count: int
    items: List[UpcomingDuesReportRow]
