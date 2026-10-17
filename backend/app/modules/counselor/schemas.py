import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# -------------------------------------------------------------
# Summary & Metric Schemas
# -------------------------------------------------------------

class PipelineStageCount(BaseModel):
    stage: str
    count: int


class CounselorSummaryMetrics(BaseModel):
    assigned_enquiries: int
    active_admissions: int
    followups_due_today: int
    overdue_followups: int
    pipeline_summary: List[PipelineStageCount]
    today_tasks: List[Dict[str, Any]]
    upcoming_reminders: List[Dict[str, Any]]
    recent_enquiries: List[Dict[str, Any]]
    admissions_requiring_action: List[Dict[str, Any]]
    next_actions: List[Dict[str, Any]]


# -------------------------------------------------------------
# Enquiry Schemas
# -------------------------------------------------------------

class EnquiryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=30)
    course_id: Optional[uuid.UUID] = None
    course_name: Optional[str] = Field(None, max_length=255)
    source: str = Field("Website", max_length=100)
    status: str = Field("New", max_length=50)
    notes: Optional[str] = None
    next_follow_up_date: Optional[date] = None


class EnquiryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=30)
    course_id: Optional[uuid.UUID] = None
    course_name: Optional[str] = Field(None, max_length=255)
    source: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    last_contact_date: Optional[date] = None
    next_follow_up_date: Optional[date] = None


class EnquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str
    phone: Optional[str] = None
    course_id: Optional[uuid.UUID] = None
    course_name: Optional[str] = None
    source: str
    status: str
    assigned_counselor_email: str
    notes: Optional[str] = None
    last_contact_date: Optional[date] = None
    next_follow_up_date: Optional[date] = None
    converted_to_student_id: Optional[uuid.UUID] = None
    converted_to_admission_id: Optional[uuid.UUID] = None
    converted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class EnquiryDetailResponse(EnquiryResponse):
    follow_ups: List[Dict[str, Any]] = []
    interactions: List[Dict[str, Any]] = []


# -------------------------------------------------------------
# Interaction Schemas
# -------------------------------------------------------------

class InteractionCreate(BaseModel):
    interaction_type: str = Field("Call", max_length=50)
    summary: str = Field(..., min_length=3, max_length=255)
    details: Optional[str] = None


class InteractionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    enquiry_id: Optional[uuid.UUID] = None
    student_id: Optional[uuid.UUID] = None
    admission_id: Optional[uuid.UUID] = None
    counselor_email: str
    interaction_type: str
    summary: str
    details: Optional[str] = None
    created_at: datetime


# -------------------------------------------------------------
# Conversion Schema
# -------------------------------------------------------------

class EnquiryConvertRequest(BaseModel):
    batch_id: Optional[uuid.UUID] = None
    course_id: Optional[uuid.UUID] = None
    course_title: Optional[str] = None
    documents_required: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None


from pydantic import BaseModel, ConfigDict, Field, EmailStr, computed_field

# -------------------------------------------------------------
# Admission Schemas
# -------------------------------------------------------------

class AdmissionUpdate(BaseModel):
    stage: Optional[str] = Field(None, max_length=50)
    current_stage: Optional[str] = None
    batch_id: Optional[uuid.UUID] = None
    documents_required: Optional[List[Dict[str, Any]]] = None
    pending_requirements: Optional[str] = None
    last_activity: Optional[str] = Field(None, max_length=255)
    next_action: Optional[str] = Field(None, max_length=255)
    follow_up_due_date: Optional[date] = None
    admin_notes: Optional[str] = None
    notes: Optional[str] = None


class AdmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    enquiry_id: Optional[uuid.UUID] = None
    student_id: Optional[uuid.UUID] = None
    student_name: str
    student_email: str
    student_phone: Optional[str] = None
    course_id: Optional[uuid.UUID] = None
    course_title: str
    batch_id: Optional[uuid.UUID] = None
    assigned_counselor_email: str
    stage: str
    application_date: date
    documents_required: Optional[List[Dict[str, Any]]] = None
    pending_requirements: Optional[str] = None
    last_activity: Optional[str] = None
    next_action: Optional[str] = None
    follow_up_due_date: Optional[date] = None
    approval_request_id: Optional[uuid.UUID] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def current_stage(self) -> str:
        return self.stage

    @computed_field
    @property
    def course_name(self) -> str:
        return self.course_title

    @computed_field
    @property
    def application_number(self) -> str:
        return f"ADM-{str(self.id)[:8].upper()}"


class AdmissionDetailResponse(AdmissionResponse):
    follow_ups: List[Dict[str, Any]] = []
    interactions: List[Dict[str, Any]] = []
    approval_status: Optional[str] = None


class SubmitApprovalRequest(BaseModel):
    notes: Optional[str] = None


# -------------------------------------------------------------
# Follow-up & Task Schemas
# -------------------------------------------------------------

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    due_datetime: datetime
    priority: str = Field("Medium", max_length=20)
    enquiry_id: Optional[uuid.UUID] = None
    student_id: Optional[uuid.UUID] = None
    admission_id: Optional[uuid.UUID] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    due_datetime: Optional[datetime] = None
    priority: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = Field(None, max_length=20)


class TaskRescheduleRequest(BaseModel):
    new_due_datetime: datetime
    reason: Optional[str] = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    enquiry_id: Optional[uuid.UUID] = None
    student_id: Optional[uuid.UUID] = None
    admission_id: Optional[uuid.UUID] = None
    assigned_counselor_email: str
    title: str
    description: Optional[str] = None
    due_datetime: datetime
    priority: str
    status: str
    completed_at: Optional[datetime] = None
    rescheduled_from_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    # Associated entity display hints
    associated_name: Optional[str] = None
    associated_type: Optional[str] = None


# -------------------------------------------------------------
# Counselor Student Views
# -------------------------------------------------------------

class CounselorStudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str
    phone: Optional[str] = None
    status: str
    assigned_counselor_email: Optional[str] = None
    notes: Optional[str] = None
    enrolled_courses: List[str] = []
    admission_stage: Optional[str] = None
    last_interaction: Optional[str] = None
    upcoming_follow_up: Optional[str] = None
    outstanding_requirements: Optional[str] = None
    created_at: datetime
