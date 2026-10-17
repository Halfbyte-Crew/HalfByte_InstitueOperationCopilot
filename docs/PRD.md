# Product Requirements Document (PRD) - EduPilot

## 1. Executive Summary & Product Vision
EduPilot is a specialized Management Information System (MIS) and AI-augmented Operations Copilot built specifically for vocational academies, IT training institutes, and technical education centers.

Traditional training institutions struggle with disconnected operations: marketing leads live in unmanaged spreadsheets, counselors track follow-ups on scratchpads, trainers mark attendance manually, and fee payments are reconciled after significant delays. This fragmentation leads to operational blindspots, revenue leakage, and poor student completion rates.

EduPilot unifies institutional operations into a synchronized, role-based platform. By integrating automated workflows, real-time analytics, and an institutional AI Copilot, EduPilot eliminates administrative friction, enforces accountability, and provides leaders with 360-degree visibility over academic and financial health.

---

## 2. Target Audience & User Personas

| Persona | Role | Key Responsibilities | Primary Needs |
|---|---|---|---|
| **Institute Owner / Director** | `super_admin` | Strategic oversight, financial approvals, policy enforcement | High-level KPI metrics, conflict resolution, staff audit trail |
| **Academic Counselor** | `counselor` | Lead management, prospective student counseling, conversions | Stage-based CRM pipeline, follow-up scheduling, conversion tracking |
| **Trainer / Faculty** | `trainer` | Delivering lectures, grading modules, recording attendance | Daily schedules, student rosters, one-click attendance, student account activation |
| **Finance Officer / Accountant** | `finance` | Fee installment tracking, payments, reconciliation, receipts | Installment aging ledger, receipt generation, financial reporting |
| **Enrolled Student** | `student` | Attending classes, tracking course milestones | Class schedule, personal attendance rate, fee receipts |

---

## 3. Core Problems & Strategic Solutions

### Problem 1: Fragmented Operational Data
- **Pain Point**: Student inquiries, admissions, batch allocations, and fee receipts reside across disjointed tools and paper logs.
- **EduPilot Solution**: A single relational PostgreSQL database with integrated workflows linking an inquiry seamlessly to a registered student, assigned batch, and structured fee schedule.

### Problem 2: Financial Data Leakage to Non-Financial Roles
- **Pain Point**: Faculty members often see fee balances and payment histories, creating awkward student interactions and privacy violations.
- **EduPilot Solution**: Absolute schema-level RBAC segregation. The backend endpoints serving trainer views completely omit all fee fields (`amount_due`, `amount_paid`, installment statuses), ensuring zero data leakage.

### Problem 3: Attendance Fraud and Tracking Inefficiencies
- **Pain Point**: Attendance is marked retrospectively or duplicated across multiple registers.
- **EduPilot Solution**: Rapid one-click batch attendance with database-level uniqueness constraints preventing duplicate submissions for the same date and student.

### Problem 4: Policy & Information Accessibility
- **Pain Point**: Staff and students struggle to navigate lengthy academic regulations, exam grading policies, and refund rules.
- **EduPilot Solution**: An integrated institutional RAG Copilot that searches verified institutional PDF/Markdown documents and generates answers strictly with page citations.

---

## 4. Key Functional Modules

### 4.1 Role-Based Dashboards
- **Owner Dashboard**: Real-time stats on active students, batch utilization, monthly collections, operational conflict detection (e.g. room/time overlaps), and pending approvals.
- **Counselor Dashboard**: Funnel overview (New, Contacted, Counseling, Admitted, Lost), scheduled follow-up task table, and one-click lead conversion.
- **Trainer Dashboard**: Today's class timetable, assigned batches with completion percentages, quick student attendance marking, and student account invitation generator.
- **Finance Dashboard**: Total receivables, collected amounts, overdue aging summary, recent payment reconciliation feed, and CSV financial exports.
- **Student Dashboard**: Attendance percentage gauge, upcoming classes, enrolled modules, and fee payment history.

### 4.2 Admissions & Student Lifecycle Management
- Unique student registration numbers (`REG-XXXXXX`).
- Status lifecycle: `Enrolled` → `Active` → `On Hold` → `Completed` → `Dropped`.
- Direct batch assignment and multi-course enrollment tracking.

### 4.3 Batch & Timetable Scheduling
- Batch code generation linked to courses and trainers.
- Classroom capacity and scheduling constraints.
- Detection of trainer double-booking or room scheduling clashes.

### 4.4 Financial Invoicing & Payment Reconciliation
- Multi-installment fee scheduling with explicit due dates.
- Decimal precision (`Numeric(12, 2)`) eliminating rounding anomalies.
- Partial and full payment recording with instant receipt generation.
- Check constraints enforcing `amount_paid <= amount_due`.

### 4.5 Dual-Control Approvals Engine
- Sensitive operations (fee waivers, batch transfer requests, course cancellations) are captured as pending approval proposals.
- Requires review and authorization from an Administrator before database execution.

### 4.6 AI Institutional Copilot (RAG)
- Conversational natural language interface for administrative policies.
- Source-bound citations (`[Academic Regulation, Page 4]`).
- Automatic fallback refusal when authoritative documentation does not contain the answer.

---

## 5. Non-Functional Requirements

### 5.1 Security & Compliance
- **Authentication**: JWT token authentication with configurable expiration.
- **Password Security**: Bcrypt password hashing (minimum 12 rounds); raw passwords never stored or logged.
- **CORS Protection**: Explicit domain whitelisting with private network access support (`allow_private_network=True`).
- **Authorization**: Backend-enforced role verification on every private endpoint via FastAPI dependencies.

### 5.2 Performance & Scalability
- **API Latency**: Sub-100ms response times for core CRUD queries.
- **Database Indexing**: Indexed foreign keys and composite unique indexes on high-frequency tables.
- **Connection Management**: Asynchronous connection pooling with pre-ping validation.

### 5.3 Usability & Design
- Clean enterprise aesthetic utilizing Tailwind CSS (Slate & Indigo theme).
- Complete state coverage: Loading skeletons, empty states, error alerts, and validation messages.
- Accessible typography, high-contrast badges, and responsive layouts across desktop and tablet screens.

---

## 6. Success Metrics & KPIs
- **95%+ Reduction in Lead-to-Enrollment Transition Time**: Immediate digital conversion from inquiry to enrolled student.
- **Zero Financial Discrepancies**: Strict check constraints preventing overpayments or unrecorded balances.
- **100% Policy Verification**: AI Copilot answers backed by physical document page citations.
- **Sub-1 Second Attendance Recording**: Trainers mark an entire batch of 20+ students within 3 clicks.
