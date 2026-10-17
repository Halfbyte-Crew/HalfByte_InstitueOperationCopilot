import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.institute import (
    AttendanceStatus,
    BatchStatus,
    ClassScheduleStatus,
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


# ---------------------------------------------------------
# Class Schedule Schemas
# ---------------------------------------------------------

class ClassScheduleBase(BaseModel):
    batch_id: uuid.UUID
    trainer_id: Optional[uuid.UUID] = None
    title: str = Field(..., min_length=2, max_length=200)
    scheduled_date: date
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    classroom: Optional[str] = Field(None, max_length=100)
    meeting_link: Optional[str] = Field(None, max_length=255)
    status: ClassScheduleStatus = ClassScheduleStatus.SCHEDULED


class ClassScheduleCreate(ClassScheduleBase):
    pass


class ClassScheduleUpdate(BaseModel):
    trainer_id: Optional[uuid.UUID] = None
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    scheduled_date: Optional[date] = None
    start_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$")
    classroom: Optional[str] = None
    meeting_link: Optional[str] = None
    status: Optional[ClassScheduleStatus] = None


class ClassScheduleResponse(ClassScheduleBase, BaseSchema):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    batch_code: Optional[str] = None
    course_title: Optional[str] = None
    trainer_name: Optional[str] = None


# ---------------------------------------------------------
# Staff Member Schemas
# ---------------------------------------------------------

class StaffMemberBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    role: str = Field(..., min_length=2, max_length=50)
    department: Optional[str] = Field(None, max_length=100)
    is_active: bool = True


class StaffMemberCreate(StaffMemberBase):
    pass


class StaffMemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone: Optional[str] = Field(None, max_length=50)
    role: Optional[str] = Field(None, min_length=2, max_length=50)
    department: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class StaffMemberResponse(StaffMemberBase, BaseSchema):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------
# Approval Request Schemas
# ---------------------------------------------------------

class ApprovalRequestBase(BaseModel):
    request_type: str = Field(..., min_length=2, max_length=100)
    title: str = Field(..., min_length=3, max_length=255)
    description: str
    requester_name: str = Field(..., min_length=2, max_length=150)
    requester_email: EmailStr
    requester_role: str = Field(..., min_length=2, max_length=50)
    payload: Optional[dict] = None


class ApprovalRequestCreate(ApprovalRequestBase):
    pass


class ApprovalActionRequest(BaseModel):
    reason: Optional[str] = None


class ApprovalRequestResponse(ApprovalRequestBase, BaseSchema):
    id: uuid.UUID
    status: str
    rejection_reason: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------
# Admin Dashboard Composite Schemas
# ---------------------------------------------------------

class AdminOverviewResponse(BaseModel):
    total_students: int
    total_batches: int
    total_trainers: int
    upcoming_classes: int
    pending_approvals_count: int
    active_conflicts_count: int
    operational_alerts_count: int
    institute_name: str
    current_term: str


class ConflictDetail(BaseModel):
    conflict_id: str
    conflict_type: str  # "TRAINER_OVERLAP" | "ROOM_DOUBLE_BOOKING"
    severity: str      # "HIGH" | "CRITICAL"
    title: str
    description: str
    scheduled_date: str
    overlapping_time: str
    affected_entity: str
    affected_sessions: List[dict]
    resolution_hint: str


class OperationalAlert(BaseModel):
    id: str
    severity: str      # "CRITICAL" | "HIGH" | "MEDIUM" | "INFO"
    title: str
    explanation: str
    relevant_date: Optional[str] = None
    affected_entity: Optional[str] = None
    action_label: str
    action_link: str
    is_ai_generated: bool = False
    is_acknowledged: bool = False

