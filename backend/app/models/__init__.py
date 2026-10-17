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
from app.models.rag import (
    DocumentChunk,
    KnowledgeDocument,
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
    "KnowledgeDocument",
    "DocumentChunk",
]
