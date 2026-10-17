"""
Trainer Dashboard Pydantic Schemas.

CRITICAL: Financial fields (fees, EMIs, payment_records, etc.) are NEVER
included in any schema in this module. This is enforced at the schema level.
"""
import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TrainerSchemaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Dashboard overview
# ---------------------------------------------------------------------------

class TrainerOverviewResponse(BaseModel):
    trainer_email: str
    trainer_name: str
    assigned_batches: int
    active_batches: int
    total_students: int
    todays_sessions: int
    attendance_pending_today: int
    upcoming_sessions_7d: int


# ---------------------------------------------------------------------------
# Schedule / Class Sessions
# ---------------------------------------------------------------------------

class SessionSummary(BaseModel):
    id: uuid.UUID
    title: str
    batch_id: uuid.UUID
    batch_code: str
    course_title: str
    scheduled_date: date
    start_time: str
    end_time: str
    classroom: Optional[str] = None
    meeting_link: Optional[str] = None
    delivery_mode: str = "Offline"
    status: str
    attendance_submitted: bool
    enrolled_count: int


class ScheduleResponse(BaseModel):
    todays_sessions: List[SessionSummary]
    upcoming_sessions: List[SessionSummary]


# ---------------------------------------------------------------------------
# Batches
# ---------------------------------------------------------------------------

class TrainerBatchSummary(BaseModel):
    id: uuid.UUID
    code: str
    course_title: str
    course_code: str
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    enrolled_students: int
    present_today: int
    attendance_rate_overall: str  # e.g. "78.5%"


class TrainerBatchListResponse(BaseModel):
    batches: List[TrainerBatchSummary]
    total: int


# ---------------------------------------------------------------------------
# Students (trainer view — no financial fields)
# ---------------------------------------------------------------------------

class TrainerStudentItem(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    phone: Optional[str] = None
    student_status: str
    enrollment_status: str
    enrolled_on: Optional[date] = None
    attendance_rate: str   # "82.4%"
    classes_attended: int
    classes_missed: int
    account_status: str   # "active" | "not_created" | "pending_activation"
    # Explicitly NO fee/EMI/payment fields


class TrainerBatchStudentsResponse(BaseModel):
    batch_id: uuid.UUID
    batch_code: str
    course_title: str
    students: List[TrainerStudentItem]
    total: int


# ---------------------------------------------------------------------------
# Attendance
# ---------------------------------------------------------------------------

class BulkAttendanceEntry(BaseModel):
    student_id: uuid.UUID
    status: str = Field(..., pattern=r"^(Present|Absent|Late|Excused)$")
    remarks: Optional[str] = Field(None, max_length=255)


class SubmitBulkAttendanceRequest(BaseModel):
    batch_id: uuid.UUID
    session_date: date
    entries: List[BulkAttendanceEntry] = Field(..., min_length=1)


class AttendanceSubmitResult(BaseModel):
    submitted: int
    updated: int
    errors: List[str]
    session_date: str
    batch_code: str


class AttendanceHistoryItem(BaseModel):
    record_id: uuid.UUID
    student_id: uuid.UUID
    student_name: str
    student_email: str
    batch_id: uuid.UUID
    batch_code: str
    course_title: str
    session_date: date
    status: str
    remarks: Optional[str]
    recorded_at: datetime
    updated_at: datetime


class AttendanceHistoryResponse(BaseModel):
    records: List[AttendanceHistoryItem]
    total: int


# ---------------------------------------------------------------------------
# Student Progress (trainer view — no financial fields)
# ---------------------------------------------------------------------------

class StudentProgressResponse(BaseModel):
    student_id: uuid.UUID
    student_name: str
    student_email: str
    student_phone: Optional[str]
    student_status: str
    batch_code: str
    course_title: str
    enrollment_status: str
    enrolled_on: Optional[date]
    total_sessions: int
    sessions_attended: int
    sessions_missed: int
    sessions_late: int
    attendance_rate: str
    recent_attendance: List[AttendanceHistoryItem]
    account_status: str
    observations: List["AcademicObservationItem"] = []
    unsupported_features_note: Optional[str] = "LMS assignments, external assessments, and module-level grading are not currently configured in this institute database."
    # Explicitly NO fee/financial data


class AcademicObservationItem(BaseModel):
    id: uuid.UUID
    batch_id: uuid.UUID
    trainer_email: str
    trainer_name: str
    observation_type: str
    note: str
    created_at: datetime


class CreateAcademicObservationRequest(BaseModel):
    batch_id: uuid.UUID
    observation_type: str = Field("Feedback", max_length=50)
    note: str = Field(..., min_length=2, max_length=2000)


# ---------------------------------------------------------------------------
# Student Account Creation / Activation
# ---------------------------------------------------------------------------

class StudentAccountStatusResponse(BaseModel):
    student_id: uuid.UUID
    student_name: str
    student_email: str
    account_status: str           # "active" | "not_created" | "pending_activation" | "suspended"
    has_login: bool
    activation_pending: bool
    next_step: str                # human-readable action hint
    activation_token_expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class CreateStudentAccountRequest(BaseModel):
    """Trainer initiates account creation for a student in their batch."""
    pass  # no body needed; all context from path params + auth token


class StudentAccountCreatedResponse(BaseModel):
    student_id: uuid.UUID
    student_name: str
    student_email: str
    account_status: str
    activation_token_issued: bool
    activation_token: Optional[str] = None
    activation_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    message: str
    next_step: str
