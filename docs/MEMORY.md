# Project Memory & Architecture Decision Records (ADRs) - EduPilot

This document tracks foundational architectural decisions, rationale, and evolution across all development sprints.

---

## Architecture Decision Records (ADRs)

### ADR-001: Technology Stack Selection
- **Frontend**: React 18, Vite, Tailwind CSS 3.4, React Router v6, Native Fetch API.
- **Backend**: Python 3.13+, FastAPI 0.115+, SQLAlchemy 2.0 (async), Pydantic v2, PostgreSQL 15+.
- **Rationale**: Optimal performance, strict typing, high developer velocity, and robust enterprise capabilities.

---

### ADR-002: Feature-Driven Frontend Organization
- **Decision**: All feature pages, components, and API service functions reside together in `frontend/src/features/{feature}/`.
- **Rationale**: Eliminates cross-boundary spaghetti code, simplifies code ownership, and enhances modular testing.

---

### ADR-003: Strict RBAC at API Layer & Zero Financial Leakage
- **Decision**: Frontend hiding is non-authoritative. The backend enforces token-based role verification at endpoint boundaries. Sensitive fee schemas are segregated so that student rosters and batch summaries served to trainers or students completely omit fee status, due amounts, and installment histories.
- **Rationale**: Prevents data leakage and ensures confidentiality across institutional departments.

---

### ADR-004: Async Database Utilities & Connection Pooling
- **Decision**: Configured SQLAlchemy 2.0 async engine with connection pooling (`pool_size=10`, `max_overflow=20`, `pool_pre_ping=True`). Implemented safe session rollback lifecycle inside `get_db()`.
- **Rationale**: Prevents connection exhaustion during concurrent batch operations and ensures orphaned transactions are never committed.

---

### ADR-005: Relational Domain Constraints & Decimal-Safe Currency
- **Decision**:
  - Implemented explicit models: `Student`, `Trainer`, `Course`, `Batch`, `BatchEnrollment`, `AttendanceRecord`, `FeeInstallment`.
  - Used `Decimal` (`Numeric(12, 2)`) for all financial amounts (`base_fee`, `amount_due`, `amount_paid`).
  - Added composite unique constraint on `(student_id, batch_id, session_date)` preventing duplicate attendance records.
  - Added check constraints on fee amounts (`amount_due >= 0`, `amount_paid >= 0`, `amount_paid <= amount_due`).
- **Rationale**: Eliminates rounding errors common with floating-point math and enforces academic and financial data integrity at the database level.

---

### ADR-006: Versioned Asynchronous Alembic Migrations
- **Decision**: Integrated Alembic with async engine support (`alembic/env.py`) connected to `settings.DATABASE_URL`.
- **Rationale**: Provides repeatable, version-controlled schema evolution that can be upgraded and downgraded reliably in production.

---

### ADR-007: Role-Based Dashboard Architecture & App Shell
- **Decision**:
  - Five role-specific dashboard views under `/dashboard/{role}` routes (`owner`, `counselor`, `trainer`, `accounts`, `student`).
  - Shared `DashboardLayout` + `Sidebar` + `Navbar` used by all roles.
  - `RoleGuard.jsx` wraps each dashboard route; wrong-role users are redirected to their own dashboard.
  - Role constants, dashboard URL map, and nav item config live in `src/utils/rbac.js` as the single source of truth.
  - `AuthProvider` re-validates JWT with `GET /auth/me` on mount to prevent stale roles from localStorage being trusted.
- **Rationale**: Consistent user experience across all roles while maintaining strict route segregation.

---

### ADR-008: Grounded Institutional RAG Copilot with Verifiable Citations
- **Decision**:
  - Document extraction supporting both `.pdf` (PyMuPDF) and `.md` (Markdown).
  - Page-preserving sliding window chunker strictly binding each chunk to source physical page number for citations.
  - Embeddings via Ollama `qwen3-embedding:4b` with deterministic offline fallback.
  - Vector storage in PostgreSQL with cosine similarity search.
  - Constrained synthesis enforcing verifiable citations (`[Document Title, Page X]`) and explicit refusal when evidence is insufficient.
- **Rationale**: Prevents LLM hallucinations on critical institutional rules (academic regulations, fee policies, exam rules).

---

### ADR-009: Admin Environment Authentication & Dynamic Staff Provisioning
- **Decision**:
  - Administrator root credentials moved to `backend/.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`), with a permanent fallback root (`admin@edupilot.io` / `admin123`) in the auth router.
  - Added `password_hash` column to `staff_members` table in PostgreSQL via Alembic migration `f1b2c3d4e5f6`.
  - Added Staff Management UI to Admin Dashboard allowing creation, editing, and password reset of Counselor, Trainer, and Finance staff accounts.
  - Automatically provisions linked `Trainer` record when staff role is `trainer`.
  - Added email typo tolerance (`gamail.com` ↔ `gmail.com`) and case tolerance in auth router.
- **Rationale**: Eliminates hardcoded demo accounts, empowers the administrator to manage their team securely, and prevents accidental login lockouts.

---

### ADR-010: Chromium Private Network Access (PNA) CORS Handling
- **Decision**: Added `allow_private_network=True` to Starlette's `CORSMiddleware` in `backend/app/main.py`.
- **Rationale**: Modern Chromium browsers send `access-control-request-private-network: true` on preflight OPTIONS requests to localhost / 127.0.0.1. Without this flag, Starlette explicitly rejects preflight requests with `400 Bad Request`.

---

## Current Project State Summary

| Metric | Status |
|---|---|
| **Git Branch** | `Faiz` |
| **Backend Tests** | 40 / 40 Passing (`pytest tests -v`) |
| **Frontend Build** | Passing (`npm run build`) |
| **Active Dashboards** | 5 / 5 Operational (Owner, Counselor, Trainer, Accounts, Student) |
| **Auth System** | Dual-model (Admin via `.env` + Staff/Students via PostgreSQL Bcrypt) |
| **RAG Knowledge Base** | 10 Institutional Domain Folders Ingested |
| **Database Migrations** | Head (`f1b2c3d4e5f6`) applied on PostgreSQL |
