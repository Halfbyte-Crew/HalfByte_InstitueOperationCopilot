"""Models package exports."""
from app.models.institute import (
    AttendanceRecord,
    AttendanceStatus,
    Batch,
    BatchEnrollment,
    BatchStatus,
    Course,
    EnrollmentStatus,
    FeeInstallment,
    FeeStatus,
    Student,
    StudentStatus,
    Trainer,
)

__all__ = [
    "Student",
    "StudentStatus",
    "Trainer",
    "Course",
    "Batch",
    "BatchStatus",
    "BatchEnrollment",
    "EnrollmentStatus",
    "AttendanceRecord",
    "AttendanceStatus",
    "FeeInstallment",
    "FeeStatus",
]
