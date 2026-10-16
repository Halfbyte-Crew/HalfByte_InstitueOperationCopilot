import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.institute import (
    AttendanceStatus,
    BatchStatus,
    EnrollmentStatus,
    FeeStatus,
    StudentStatus,
)


# ---------------------------------------------------------
# Shared Base Schema
# ---------------------------------------------------------

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Student Schemas
# ---------------------------------------------------------

class StudentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=30)
    status: StudentStatus = StudentStatus.ENROLLED
    notes: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=30)
    status: Optional[StudentStatus] = None
    notes: Optional[str] = None


class StudentResponse(StudentBase, BaseSchema):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------
# Trainer Schemas
# ---------------------------------------------------------

class TrainerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=30)
    specialization: str = Field(..., min_length=2, max_length=255)
    bio: Optional[str] = None


class TrainerCreate(TrainerBase):
    pass


class TrainerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=30)
    specialization: Optional[str] = Field(None, min_length=2, max_length=255)
    bio: Optional[str] = None


class TrainerResponse(TrainerBase, BaseSchema):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------
# Course Schemas
# ---------------------------------------------------------

class CourseBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    duration_weeks: int = Field(..., ge=1, le=104)
    base_fee: Decimal = Field(default=Decimal("0.00"), ge=0)


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    duration_weeks: Optional[int] = Field(None, ge=1, le=104)
    base_fee: Optional[Decimal] = Field(None, ge=0)


class CourseResponse(CourseBase, BaseSchema):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------
# Batch Schemas
# ---------------------------------------------------------

class BatchBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    course_id: uuid.UUID
    trainer_id: Optional[uuid.UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    capacity: int = Field(default=30, ge=1, le=200)
    status: BatchStatus = BatchStatus.UPCOMING


class BatchCreate(BatchBase):
    pass


class BatchUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    course_id: Optional[uuid.UUID] = None
    trainer_id: Optional[uuid.UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    capacity: Optional[int] = Field(None, ge=1, le=200)
    status: Optional[BatchStatus] = None


class BatchResponse(BatchBase, BaseSchema):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------
# Enrollment Schemas
# ---------------------------------------------------------

class EnrollmentCreate(BaseModel):
    student_id: uuid.UUID
    batch_id: uuid.UUID
    enrolled_on: Optional[date] = None
    status: EnrollmentStatus = EnrollmentStatus.ENROLLED


class EnrollmentUpdate(BaseModel):
    status: EnrollmentStatus


class EnrollmentResponse(BaseSchema):
    id: uuid.UUID
    student_id: uuid.UUID
    batch_id: uuid.UUID
    enrolled_on: date
    status: EnrollmentStatus
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------
# Attendance Schemas
# ---------------------------------------------------------

class AttendanceRecordCreate(BaseModel):
    student_id: uuid.UUID
    batch_id: uuid.UUID
    session_date: date
    status: AttendanceStatus = AttendanceStatus.PRESENT
    remarks: Optional[str] = Field(None, max_length=255)


class AttendanceRecordUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    remarks: Optional[str] = Field(None, max_length=255)


class AttendanceRecordResponse(BaseSchema):
    id: uuid.UUID
    student_id: uuid.UUID
    batch_id: uuid.UUID
    session_date: date
    status: AttendanceStatus
    remarks: Optional[str]
    created_at: datetime
    updated_at: datetime


class AttendanceSummaryItem(BaseModel):
    batch_id: uuid.UUID
    batch_code: str
    total_students: int
    present_today: int
    attendance_rate: str


# ---------------------------------------------------------
# Fee Schemas
# ---------------------------------------------------------

class FeeInstallmentCreate(BaseModel):
    student_id: uuid.UUID
    batch_id: Optional[uuid.UUID] = None
    title: str = Field(..., min_length=2, max_length=100)
    amount_due: Decimal = Field(..., gt=0)
    amount_paid: Decimal = Field(default=Decimal("0.00"), ge=0)
    due_date: date
    paid_date: Optional[date] = None
    status: FeeStatus = FeeStatus.PENDING
    receipt_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class FeePaymentRecord(BaseModel):
    payment_amount: Decimal = Field(..., gt=0)
    payment_date: Optional[date] = None
    receipt_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class FeeInstallmentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=100)
    amount_due: Optional[Decimal] = Field(None, gt=0)
    amount_paid: Optional[Decimal] = Field(None, ge=0)
    due_date: Optional[date] = None
    paid_date: Optional[date] = None
    status: Optional[FeeStatus] = None
    receipt_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class FeeInstallmentResponse(BaseSchema):
    id: uuid.UUID
    student_id: uuid.UUID
    batch_id: Optional[uuid.UUID]
    title: str
    amount_due: Decimal
    amount_paid: Decimal
    due_date: date
    paid_date: Optional[date]
    status: FeeStatus
    receipt_number: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class FeeOverviewResponse(BaseModel):
    total_receivable: Decimal
    total_collected: Decimal
    total_outstanding: Decimal
    collection_rate: str
