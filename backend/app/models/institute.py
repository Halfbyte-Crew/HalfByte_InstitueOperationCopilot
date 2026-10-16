import enum
import uuid
from datetime import date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import (
    CheckConstraint,
    Date,
    Enum as SAEnum,
    ForeignKey,
    Integer,
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
