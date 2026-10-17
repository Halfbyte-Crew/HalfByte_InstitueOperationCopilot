# Software Requirements Specification (SRS) - EduPilot

## 1. System Overview & Scope
This document specifies the rigorous functional (`FR-*`) and non-functional (`NFR-*`) requirements for the EduPilot platform. It serves as the baseline contract for engineering, validation, and automated testing across frontend and backend services.

---

## 2. Functional Requirements (FR)

### 2.1 Authentication & Credential Management
- **FR-AUTH-01 (JWT Authentication)**: The system shall issue signed JWT access tokens containing subject (`sub`) and role (`role`) upon valid credential submission to `POST /api/v1/auth/login`.
- **FR-AUTH-02 (Admin Root Auth)**: The system shall support Administrator root login loaded from `.env` configuration (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) with hardcoded fallback support for `admin@edupilot.io` / `admin123`.
- **FR-AUTH-03 (Staff Provisioning)**: The system shall allow Administrators to create and manage staff accounts (`counselor`, `trainer`, `finance`, `coordinator`) in the database with Bcrypt password hashing (`POST /api/v1/staff`).
- **FR-AUTH-04 (Staff Password Management)**: The system shall provide an endpoint for Administrators to update or reset staff passwords (`POST /api/v1/staff/{id}/reset-password`).
- **FR-AUTH-05 (Staff Login Resilience)**: The system authentication service shall implement domain typo tolerance (`gamail.com` ↔ `gmail.com`) and case tolerance to prevent accidental user lockouts.
- **FR-AUTH-06 (Session Introspection)**: The system shall provide a `GET /api/v1/auth/me` endpoint validating the current JWT and returning authenticated user details.
- **FR-AUTH-07 (Student Account Activation)**: The system shall allow enrolled students to activate their portal account using single-use verification tokens (`POST /api/v1/auth/activate-student`).

---

### 2.2 Role-Based Access Control & Security Boundaries
- **FR-RBAC-01 (Role Enforcement)**: The system shall enforce endpoint-level role verification using `require_roles(...)` across all private REST endpoints.
- **FR-RBAC-02 (Financial Data Isolation)**: The system shall strictly forbid users with role `trainer`, `counselor`, or `student` from accessing financial routes (`/api/v1/fees/*`), returning HTTP 403 Forbidden.
- **FR-RBAC-03 (Schema-Level Omission)**: Student rosters and batch summaries served to trainers shall omit all fee, balance, and installment properties at the Pydantic schema level.
- **FR-RBAC-04 (Frontend Route Guarding)**: The frontend application shall intercept navigation attempts via `RoleGuard.jsx`, redirecting unauthorized users to their designated role dashboard without displaying raw errors.

---

### 2.3 Student, Course & Batch Administration
- **FR-STU-01 (Student Management)**: The system shall support CRUD operations for students, tracking registration numbers, email, phone, enrollment date, and academic status.
- **FR-STU-02 (Course Catalog)**: The system shall support courses with unique codes, names, syllabus descriptions, duration in weeks, and base tuition fees.
- **FR-STU-03 (Trainer Directory)**: The system shall maintain trainer profiles linked to specialized subjects and assigned batches.
- **FR-STU-04 (Batch Allocation)**: The system shall schedule cohort batches linking a course, trainer, classroom, schedule timing, and maximum student capacity.
- **FR-STU-05 (Batch Enrollment)**: The system shall track student enrollments in batches with unique constraints preventing duplicate active enrollments in the same batch.

---

### 2.4 Attendance Tracking System
- **FR-ATT-01 (Session Attendance)**: The system shall record student session attendance with statuses: `Present`, `Absent`, `Late`, `Excused` (`POST /api/v1/attendance`).
- **FR-ATT-02 (Duplicate Prevention)**: The database shall enforce a composite uniqueness constraint on `(student_id, batch_id, session_date)` preventing double-marking of attendance.
- **FR-ATT-03 (Attendance Analytics)**: The system shall compute batch-level attendance percentages and highlight students falling below the 75% minimum institutional attendance threshold.
- **FR-ATT-04 (Trainer Attendance Interface)**: The system shall provide trainers with a rapid one-click attendance interface to mark an entire batch roster simultaneously.

---

### 2.5 Financial Management & Fee Reconciliation
- **FR-FEE-01 (Installment Schedules)**: The system shall create structured installment schedules for enrolled students with exact due dates and decimal amounts.
- **FR-FEE-02 (Payment Recording)**: The system shall record payments against installments, updating `amount_paid` and status (`Paid`, `Partial`, `Pending`, `Overdue`).
- **FR-FEE-03 (Overpayment Guard)**: The system shall reject payments where `amount_paid > amount_due` via database check constraints and API validation.
- **FR-FEE-04 (Financial Overview & Export)**: The system shall provide aggregate revenue metrics (total billed, collected, outstanding dues) and generate downloadable CSV financial ledgers.
- **FR-FEE-05 (Receipt Generation)**: The system shall generate digital receipt summaries with transaction IDs, payment dates, and payment methods.

---

### 2.6 Academic Counselor & Lead Pipeline
- **FR-CRM-01 (Enquiry Tracking)**: The system shall log student inquiries across lead stages: `New`, `Contacted`, `Counseling`, `Demo Scheduled`, `Admitted`, `Lost`.
- **FR-CRM-02 (Follow-up Tasks)**: The system shall support scheduling follow-up calls with priority flags, notes, and completion toggles.
- **FR-CRM-03 (Lead Conversion)**: The system shall convert admitted inquiries directly into registered student records with automatic profile creation.

---

### 2.7 AI Copilot & Grounded RAG Assistant
- **FR-RAG-01 (Document Ingestion)**: The system shall extract and segment institutional knowledge documents (PDF and Markdown) while preserving physical source page numbers.
- **FR-RAG-02 (Vector Search)**: The system shall store embeddings in PostgreSQL and perform Top-K cosine similarity retrieval matching user natural language queries.
- **FR-RAG-03 (Role-Based Retrieval)**: The system shall restrict knowledge base searches based on user role (e.g., student users cannot retrieve confidential HR/payroll documents).
- **FR-RAG-04 (Grounded Citations)**: The system shall synthesize responses containing verifiable bracketed citations: `[Document Title, Page X]`.
- **FR-RAG-05 (Refusal Policy)**: The AI assistant shall explicitly refuse to fabricate answers when retrieved context is insufficient to answer the inquiry.

---

### 2.8 Action Approvals Engine
- **FR-APP-01 (Approval Queue)**: Sensitive operational proposals (fee waivers, batch cancellations) shall enter a pending approval queue.
- **FR-APP-02 (Two-Man Rule)**: Approval actions shall require review and authorization by an Administrator before executing mutations on the database.

---

## 3. Non-Functional Requirements (NFR)

### 3.1 Performance & Latency
- **NFR-PERF-01**: Standard read queries shall respond within 150ms under normal load.
- **NFR-PERF-02**: Database connection pool shall maintain `pool_size=10` with up to `max_overflow=20` to support concurrent asynchronous requests.

### 3.2 Security & Integrity
- **NFR-SEC-01**: Passwords must be hashed using Bcrypt with a work factor of 12.
- **NFR-SEC-02**: Private Network Access CORS headers (`allow_private_network=True`) must be enabled to prevent preflight rejections on modern browser clients.
- **NFR-SEC-03**: Monetary values must be stored using arbitrary-precision decimal representations (`Numeric(12, 2)`).

### 3.3 Reliability & Recoverability
- **NFR-REL-01**: All database mutations must execute inside atomic transactions; partial failures must trigger an automatic rollback.
- **NFR-REL-02**: Schema changes must be managed via version-controlled Alembic migrations capable of upgrading and downgrading cleanly.
