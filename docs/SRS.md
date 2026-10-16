# Software Requirements Specification (SRS) - EduPilot

## 1. Introduction
This document defines functional and non-functional requirements for the EduPilot platform.

## 2. Functional Requirements

### 2.1 Authentication & Authorization
- **FR-AUTH-1**: The system must provide secure JWT-based authentication with expiration and refresh mechanisms.
- **FR-AUTH-2**: The system must enforce Role-Based Access Control (RBAC) across roles: `super_admin`, `admin`, `coordinator`, `finance`, `trainer`.
- **FR-AUTH-3**: The system must strictly reject access to fee endpoints if the authenticated user does not have `super_admin`, `admin`, or `finance` roles.

### 2.2 Student, Course & Batch Management [IMPLEMENTED - Sprint 2]
- **FR-STU-1**: Relational CRUD operations for student profiles (`Student` model, `POST/GET/PATCH /api/v1/students`).
- **FR-STU-2**: Course and curriculum management with unique codes and duration tracking (`POST/GET/PATCH /api/v1/courses`).
- **FR-STU-3**: Trainer faculty directory and specialization management (`POST/GET/PATCH /api/v1/trainers`).
- **FR-STU-4**: Cohort batch management linked to courses and trainers (`POST/GET/PATCH /api/v1/batches`).
- **FR-STU-5**: Batch enrollment tracking with many-to-many relationship and unique student-batch constraint (`POST/GET /api/v1/batches/{batch_id}/enrollments`).

### 2.3 Attendance Tracking [IMPLEMENTED - Sprint 2]
- **FR-ATT-1**: Mark session attendance per batch with statuses: Present, Absent, Late, Excused (`POST /api/v1/attendance`).
- **FR-ATT-2**: Enforce uniqueness constraint preventing duplicate attendance for the same student, batch, and session date (`uq_student_batch_session_date`).
- **FR-ATT-3**: Batch attendance summary reporting active enrollment and daily attendance rates (`GET /api/v1/attendance/summary`).

### 2.4 Fee Management (Secured) [IMPLEMENTED - Sprint 2]
- **FR-FEE-1**: Record fee installments with decimal-safe financial amounts, explicit due dates, and receipts (`POST/GET /api/v1/fees`).
- **FR-FEE-2**: Partial and full payment tracking with overpayment constraint validation (`POST /api/v1/fees/{id}/payments`).
- **FR-FEE-3**: Aggregated fee collection velocity overview (`GET /api/v1/fees/overview`).
- **FR-FEE-4**: Strict RBAC boundary requiring `super_admin`, `admin`, or `finance` roles, rejecting unauthorized roles.

### 2.5 AI Operations Copilot
- **FR-COP-1**: Process natural language inquiries regarding institute metrics via backend FastAPI copilot service.
- **FR-COP-2**: Generate draft actions with full structured parameter specifications.
- **FR-COP-3**: Actions exceeding authorization thresholds or marked sensitive must enter the approval queue rather than executing immediately.

### 2.6 Approvals & Audit Trail
- **FR-APP-1**: List pending action approval requests with submitter, diff/payload, and timestamp.
- **FR-APP-2**: Provide Approve/Reject endpoints with mandatory reviewer reasoning.
- **FR-AUD-1**: Write immutable event logs for every write, update, delete, and sensitive read action.

## 3. Data Requirements & Schema Constraints
- Database: PostgreSQL with async SQLAlchemy / SQLModel.
- Unique constraints: Student email, User email, Course code, Batch code.
- Foreign Key cascades: Enforce soft-deletes or restricted cascades to protect operational history.
