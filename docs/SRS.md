# Software Requirements Specification (SRS) - EduPilot

## 1. Introduction
This document defines functional and non-functional requirements for the EduPilot platform.

## 2. Functional Requirements

### 2.1 Authentication & Authorization
- **FR-AUTH-1**: The system must provide secure JWT-based authentication with expiration and refresh mechanisms.
- **FR-AUTH-2**: The system must enforce Role-Based Access Control (RBAC) across roles: `super_admin`, `admin`, `coordinator`, `finance`, `trainer`.
- **FR-AUTH-3**: The system must strictly reject access to fee endpoints if the authenticated user does not have `super_admin`, `admin`, or `finance` roles.

### 2.2 Student & Course Management
- **FR-STU-1**: CRUD operations for student profiles including contact info, enrollment date, and status.
- **FR-STU-2**: CRUD operations for courses, curricula, and batch assignments.
- **FR-STU-3**: Student filtering by status, batch, course, and enrollment date range.

### 2.3 Attendance Tracking
- **FR-ATT-1**: Mark session attendance per batch (Present, Absent, Late, Excused).
- **FR-ATT-2**: Compute aggregate attendance percentages per student and highlight at-risk individuals (<75%).

### 2.4 Fee Management (Secured)
- **FR-FEE-1**: Record fee installments, due dates, payments, and receipts.
- **FR-FEE-2**: Never return fee-related schema attributes or calculations in endpoints accessible to `trainer` or non-authorized roles.

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
