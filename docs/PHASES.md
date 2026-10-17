# Project Phases & Milestone Roadmap - EduPilot

## Overview & Execution Strategy
EduPilot's roadmap is divided into strict chronological sprints. Sprints build upon established data structures and security boundaries, ensuring zero regressions across earlier operational milestones.

---

## Phase 1: Project Scaffolding & Foundation [COMPLETED]
- [x] Establish canonical repository layout (`docs/`, `frontend/`, `backend/`, configuration files).
- [x] Author core documentation suite (`PRD`, `SRS`, `ARCHITECTURE`, `UI_UX`, `DEVELOPMENT`, `SECURITY`, `RULES`, `PHASES`, `MEMORY`).
- [x] Configure frontend build tooling (Vite, React 18, Tailwind CSS, PostCSS, ESLint, React Router).
- [x] Build shared atomic UI component library (`Button`, `Input`, `Modal`, `Table`, `Badge`, `Loader`, `PageHeader`, `EmptyState`).
- [x] Configure backend architecture (FastAPI entrypoint, database session management, core config, security, exceptions).
- [x] Configure Docker Compose orchestration for local development (`db`, `backend`, `frontend`).
- [x] Establish asynchronous Alembic migration framework (`alembic upgrade head`).

---

## Phase 2: Core Data Layer, Relational APIs & Feature Views [COMPLETED]
- [x] Database configuration & async SQLAlchemy connection pooling with health probing.
- [x] Relational domain models (`Student`, `Trainer`, `Course`, `Batch`, `BatchEnrollment`, `AttendanceRecord`, `FeeInstallment`).
- [x] Alembic versioned migrations with async engine support.
- [x] Automated repeatable seed script (`python -m scripts.seed_data`).
- [x] Core REST APIs with Pydantic v2 validation (Students, Courses, Batches, Trainers, Attendance, Fees).
- [x] CORS middleware origin handling and preflight support.
- [x] Feature API client modules (`studentsApi.js`, `coursesApi.js`, `batchesApi.js`, `trainersApi.js`, `feesApi.js`).
- [x] Frontend feature pages live-wired to backend APIs (`StudentsPage`, `CoursesPage`, `BatchesPage`, `TrainersPage`, `FeesPage`).
- [x] Integration test suite for core operations passing (4/4 passed).

---

## Phase 3: Role-Based Dashboards & App Shell [COMPLETED]
- [x] Five role-specific dashboard views: Owner, Counselor, Trainer, Accounts, Student.
- [x] Shared `DashboardLayout` + role-aware `Sidebar` + `Navbar`.
- [x] Route-level `RoleGuard.jsx` with automatic redirection to user's authorized dashboard.
- [x] Single source of truth for RBAC and navigation items (`src/utils/rbac.js`).
- [x] Real backend login endpoint (`POST /api/v1/auth/login`) issuing signed JWT tokens.
- [x] `AuthProvider` validating tokens on mount via `GET /api/v1/auth/me`.
- [x] Five backend dashboard endpoints scoped by role (`/api/v1/dashboard/{owner|counselor|trainer|accounts|student}`).
- [x] Zero financial fields in trainer and student endpoints enforced at schema level.

---

## Phase 4: Institutional AI Copilot & Grounded RAG Pipeline [COMPLETED]
- [x] Document extraction pipeline (`DocumentExtractor`) supporting `.pdf` (PyMuPDF) and `.md` (Markdown).
- [x] Page-preserving chunking (`DocumentChunker`) with sliding-window overlap and physical page metadata binding.
- [x] Vector embedding service (`EmbeddingService`) supporting Ollama `qwen3-embedding:4b` with deterministic offline fallback.
- [x] Vector store in PostgreSQL (`knowledge_documents` and `document_chunks`) with cosine similarity search.
- [x] Role-based retriever filtering out confidential administrative documents from non-authorized users.
- [x] Grounded answer generator with verifiable citation tags `[Document Title, Page X]` and hallucination refusal policy.
- [x] Interactive Copilot UI in frontend (`CopilotPage.jsx`) with live citation chips and starter prompt suggestions.
- [x] CLI ingestion tool (`python scripts/ingest_knowledge_base.py`) indexing all 10 domain folders.

---

## Phase 5: Trainer Dashboard, Student Provisioning & Staff Credential Management [COMPLETED]
- [x] Complete Trainer Dashboard implementation:
  - Today's classes and upcoming schedules with classroom details.
  - Assigned batch cards with student counts and academic completion rates.
  - One-click attendance recording modal with status toggles (`Present`, `Absent`, `Late`, `Excused`).
  - Student progress and observation notes logging.
  - Student account invitation generator creating single-use tokens.
- [x] Student account activation endpoint (`POST /api/v1/auth/activate-student`) with password setup.
- [x] Admin Environment Authentication:
  - Moved Administrator credentials to `backend/.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
  - Hardcoded fallback root (`admin@edupilot.io` / `admin123`) guaranteeing operational access.
- [x] Staff Management & Dynamic Credential Provisioning:
  - Added `password_hash` to `staff_members` table via Alembic migration.
  - Admin Staff Management UI: create Counselor, Trainer, and Finance accounts with passwords.
  - Staff password reset modal and action in UI.
  - Auto-creation of linked `Trainer` record when staff role is `trainer`.
  - Email typo tolerance (`gamail.com` ↔ `gmail.com`) and case tolerance in auth router.
- [x] Private Network Access (PNA) CORS fix (`allow_private_network=True`) resolving Chrome preflight 400 errors.
- [x] 40/40 Unit and Integration tests passing cleanly.

---

## Phase 6: Financial Enhancements & Invoicing Workflows [NEXT UP]
- [ ] Automated PDF fee receipt generation and downloadable invoice summaries.
- [ ] Automated overdue payment reminder email drafts via Copilot.
- [ ] Financial balance ledger and installment reconciliation auditing.

---

## Phase 7: Production Hardening, E2E Testing & Deployment [UPCOMING]
- [ ] End-to-end Cypress or Playwright test suites covering full user journeys across all 5 roles.
- [ ] Rate limiting on authentication and AI Copilot endpoints.
- [ ] Production Dockerfile optimization with multi-stage builds.
- [ ] Accessibility review (WCAG 2.1 AA compliance).
