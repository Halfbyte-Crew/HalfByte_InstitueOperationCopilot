import enum
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Any, Dict
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


# ---------------------------------------------------------
# Enums
# ---------------------------------------------------------

class StudentStatus(str, enum.Enum):
    ENROLLED = "Enrolled"
    ACTIVE = "Active"
    ON_HOLD = "On Hold"
    COMPLETED = "Completed"
    DROPPED = "Dropped"


class BatchStatus(str, enum.Enum):
    UPCOMING = "Upcoming"
    ACTIVE = "Active"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class EnrollmentStatus(str, enum.Enum):
    ENROLLED = "Enrolled"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    DROPPED = "Dropped"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "Present"
    ABSENT = "Absent"
    LATE = "Late"
    EXCUSED = "Excused"


class FeeStatus(str, enum.Enum):
    PENDING = "Pending"
    PAID = "Paid"
    PARTIALLY_PAID = "Partially Paid"
    OVERDUE = "Overdue"
    WAIVED = "Waived"


class ClassScheduleStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


# ---------------------------------------------------------
# Core Domain Models
# ---------------------------------------------------------

class Student(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Student profile and demographic details."""
    __tablename__ = "students"

    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    status: Mapped[StudentStatus] = mapped_column(
        SAEnum(StudentStatus, name="student_status_enum", native_enum=False),
        default=StudentStatus.ENROLLED,
        nullable=False,
        index=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assigned_counselor_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)

    # Relationships
    enrollments: Mapped[List["BatchEnrollment"]] = relationship(
        "BatchEnrollment", back_populates="student", cascade="all, delete-orphan"
    )
    attendance_records: Mapped[List["AttendanceRecord"]] = relationship(
        "AttendanceRecord", back_populates="student", cascade="all, delete-orphan"
    )
    fee_installments: Mapped[List["FeeInstallment"]] = relationship(
        "FeeInstallment", back_populates="student", cascade="all, delete-orphan"
    )
    payment_transactions: Mapped[List["PaymentTransaction"]] = relationship(
        "PaymentTransaction", back_populates="student", cascade="all, delete-orphan"
    )


class Trainer(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Faculty and instructors."""
    __tablename__ = "trainers"

    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    specialization: Mapped[str] = mapped_column(String(255), nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    batches: Mapped[List["Batch"]] = relationship("Batch", back_populates="trainer")


class Course(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Course catalog and curriculum."""
    __tablename__ = "courses"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_weeks: Mapped[int] = mapped_column(Integer, nullable=False)
    base_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))

    # Relationships
    batches: Mapped[List["Batch"]] = relationship("Batch", back_populates="course")


class Batch(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A scheduled cohort for a course taught by an assigned trainer."""
    __tablename__ = "batches"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    course_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    trainer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("trainers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    status: Mapped[BatchStatus] = mapped_column(
        SAEnum(BatchStatus, name="batch_status_enum", native_enum=False),
        default=BatchStatus.UPCOMING,
        nullable=False,
        index=True,
    )

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="batches")
    trainer: Mapped[Optional["Trainer"]] = relationship("Trainer", back_populates="batches")
    enrollments: Mapped[List["BatchEnrollment"]] = relationship(
        "BatchEnrollment", back_populates="batch", cascade="all, delete-orphan"
    )
    attendance_records: Mapped[List["AttendanceRecord"]] = relationship(
        "AttendanceRecord", back_populates="batch", cascade="all, delete-orphan"
    )
    fee_installments: Mapped[List["FeeInstallment"]] = relationship(
        "FeeInstallment", back_populates="batch"
    )
    schedules: Mapped[List["ClassSchedule"]] = relationship(
        "ClassSchedule", back_populates="batch", cascade="all, delete-orphan"
    )


class BatchEnrollment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Many-to-many relationship tracking a student's enrollment inside a batch."""
    __tablename__ = "batch_enrollments"
    __table_args__ = (
        UniqueConstraint("student_id", "batch_id", name="uq_student_batch_enrollment"),
    )

    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True
    )
    enrolled_on: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    status: Mapped[EnrollmentStatus] = mapped_column(
        SAEnum(EnrollmentStatus, name="enrollment_status_enum", native_enum=False),
        default=EnrollmentStatus.ENROLLED,
        nullable=False,
    )

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="enrollments")
    batch: Mapped["Batch"] = relationship("Batch", back_populates="enrollments")


class AttendanceRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Daily/session attendance entry for a student within a batch."""
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("student_id", "batch_id", "session_date", name="uq_student_batch_session_date"),
    )

    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[AttendanceStatus] = mapped_column(
        SAEnum(AttendanceStatus, name="attendance_status_enum", native_enum=False),
        default=AttendanceStatus.PRESENT,
        nullable=False,
    )
    remarks: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="attendance_records")
    batch: Mapped["Batch"] = relationship("Batch", back_populates="attendance_records")


class FeeInstallment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Scheduled and paid fee installment records for a student."""
    __tablename__ = "fee_installments"
    __table_args__ = (
        CheckConstraint("amount_due >= 0", name="chk_fee_amount_due_positive"),
        CheckConstraint("amount_paid >= 0", name="chk_fee_amount_paid_positive"),
        CheckConstraint("amount_paid <= amount_due", name="chk_fee_amount_paid_lte_due"),
    )

    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    batch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("batches.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "Installment 1", "Registration"
    amount_due: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    paid_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[FeeStatus] = mapped_column(
        SAEnum(FeeStatus, name="fee_status_enum", native_enum=False),
        default=FeeStatus.PENDING,
        nullable=False,
        index=True,
    )
    receipt_number: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="fee_installments")
    batch: Mapped[Optional["Batch"]] = relationship("Batch", back_populates="fee_installments")
    payments: Mapped[List["PaymentTransaction"]] = relationship(
        "PaymentTransaction", back_populates="installment", cascade="all, delete-orphan"
    )


class PaymentTransaction(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Immutable financial ledger of payments recorded against student fee installments."""
    __tablename__ = "payment_transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_payment_amount_positive"),
    )

    installment_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("fee_installments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False, index=True)
    payment_method: Mapped[str] = mapped_column(String(50), default="UPI", nullable=False, index=True)  # UPI, Bank Transfer, Cash, Card
    transaction_reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    receipt_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    payment_status: Mapped[str] = mapped_column(String(50), default="Successful", nullable=False, index=True)  # Successful, Pending Verification, Failed
    reconciliation_status: Mapped[str] = mapped_column(String(50), default="Unreconciled", nullable=False, index=True)  # Unreconciled, Reconciled, Discrepancy
    reconciled_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reconciled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    discrepancy_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recorded_by: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="payment_transactions")
    installment: Mapped[Optional["FeeInstallment"]] = relationship("FeeInstallment", back_populates="payments")


class ClassSchedule(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Scheduled class/session for a batch, assigned to a trainer and room/link."""
    __tablename__ = "class_schedules"

    batch_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True
    )
    trainer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("trainers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)  # HH:MM
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)    # HH:MM
    classroom: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    meeting_link: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[ClassScheduleStatus] = mapped_column(
        SAEnum(ClassScheduleStatus, name="class_schedule_status_enum", native_enum=False),
        default=ClassScheduleStatus.SCHEDULED,
        nullable=False,
        index=True,
    )

    # Relationships
    batch: Mapped["Batch"] = relationship("Batch", back_populates="schedules")
    trainer: Mapped[Optional["Trainer"]] = relationship("Trainer")


class StaffMember(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Institute personnel directory record."""
    __tablename__ = "staff_members"

    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="coordinator", index=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class ApprovalRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Administrative approval requests."""
    __tablename__ = "approval_requests"

    request_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requester_name: Mapped[str] = mapped_column(String(150), nullable=False)
    requester_email: Mapped[str] = mapped_column(String(255), nullable=False)
    requester_role: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False, index=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)


# ---------------------------------------------------------
# Counselor & Admission Workflow Models
# ---------------------------------------------------------

class Enquiry(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Prospective student enquiry assigned to an admissions counselor."""
    __tablename__ = "enquiries"

    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    course_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True
    )
    course_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source: Mapped[str] = mapped_column(String(100), default="Website", nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="New", nullable=False, index=True)
    assigned_counselor_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_contact_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    next_follow_up_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    converted_to_student_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("students.id", ondelete="SET NULL"), nullable=True
    )
    converted_to_admission_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("admissions.id", ondelete="SET NULL", use_alter=True, name="fk_enquiries_converted_to_admission_id"), nullable=True
    )
    converted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    course: Mapped[Optional["Course"]] = relationship("Course")
    student: Mapped[Optional["Student"]] = relationship("Student")
    admission: Mapped[Optional["Admission"]] = relationship(
        "Admission", foreign_keys=[converted_to_admission_id]
    )
    follow_ups: Mapped[List["CounselorTask"]] = relationship(
        "CounselorTask", back_populates="enquiry", cascade="all, delete-orphan"
    )
    interactions: Mapped[List["InteractionLog"]] = relationship(
        "InteractionLog", back_populates="enquiry", cascade="all, delete-orphan"
    )


class Admission(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Formal admission application tracking student progress from enquiry to enrollment."""
    __tablename__ = "admissions"

    enquiry_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("enquiries.id", ondelete="SET NULL"), nullable=True, index=True
    )
    student_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("students.id", ondelete="SET NULL"), nullable=True, index=True
    )
    student_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    student_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    student_phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    course_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True
    )
    course_title: Mapped[str] = mapped_column(String(255), nullable=False)
    batch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("batches.id", ondelete="SET NULL"), nullable=True, index=True
    )
    assigned_counselor_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    stage: Mapped[str] = mapped_column(String(50), default="Application Started", nullable=False, index=True)
    application_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    documents_required: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    pending_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_activity: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    next_action: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    follow_up_due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    approval_request_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("approval_requests.id", ondelete="SET NULL"), nullable=True
    )
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    course: Mapped[Optional["Course"]] = relationship("Course")
    batch: Mapped[Optional["Batch"]] = relationship("Batch")
    student: Mapped[Optional["Student"]] = relationship("Student")
    approval_request: Mapped[Optional["ApprovalRequest"]] = relationship("ApprovalRequest")
    follow_ups: Mapped[List["CounselorTask"]] = relationship(
        "CounselorTask", back_populates="admission", cascade="all, delete-orphan"
    )
    interactions: Mapped[List["InteractionLog"]] = relationship(
        "InteractionLog", back_populates="admission", cascade="all, delete-orphan"
    )


class CounselorTask(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Follow-up action item or reminder assigned to a counselor."""
    __tablename__ = "counselor_tasks"

    enquiry_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("enquiries.id", ondelete="CASCADE"), nullable=True, index=True
    )
    student_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), nullable=True, index=True
    )
    admission_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("admissions.id", ondelete="CASCADE"), nullable=True, index=True
    )
    assigned_counselor_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    due_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="Pending", nullable=False, index=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rescheduled_from_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("counselor_tasks.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    enquiry: Mapped[Optional["Enquiry"]] = relationship("Enquiry", back_populates="follow_ups")
    admission: Mapped[Optional["Admission"]] = relationship("Admission", back_populates="follow_ups")
    student: Mapped[Optional["Student"]] = relationship("Student")


class InteractionLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Audit log of communications, calls, emails, and meetings with prospects and students."""
    __tablename__ = "interaction_logs"

    enquiry_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("enquiries.id", ondelete="CASCADE"), nullable=True, index=True
    )
    student_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), nullable=True, index=True
    )
    admission_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("admissions.id", ondelete="CASCADE"), nullable=True, index=True
    )
    counselor_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    interaction_type: Mapped[str] = mapped_column(String(50), default="Call", nullable=False)
    summary: Mapped[str] = mapped_column(String(255), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    enquiry: Mapped[Optional["Enquiry"]] = relationship("Enquiry", back_populates="interactions")
    admission: Mapped[Optional["Admission"]] = relationship("Admission", back_populates="interactions")
    student: Mapped[Optional["Student"]] = relationship("Student")

