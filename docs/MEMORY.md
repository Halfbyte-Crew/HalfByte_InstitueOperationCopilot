# Project Memory & Decision Log - EduPilot

## 1. Architectural Decisions

- **ADR-001: Technology Stack Selection**
  - **Frontend**: React + Vite + Tailwind CSS + React Router + Native Fetch API.
  - **Backend**: Python FastAPI + SQLAlchemy (async) + Pydantic v2 + PostgreSQL.
  - **Decision Date**: Initial setup.
  - **Rationale**: Optimal performance, strict typing, high developer velocity, and robust enterprise capabilities.

- **ADR-002: Feature-Driven Frontend Organization**
  - All feature pages, components, and API service functions reside together in `frontend/src/features/{feature}/`.
  - Shared UI components (`components/ui`) and layouts (`layouts/`) remain domain-agnostic.
  - **Rationale**: Eliminates cross-boundary spaghetti code, simplifies code ownership, and enhances modular testing.

- **ADR-003: Human-in-the-Loop for Copilot Actions**
  - Operations suggested by the AI Copilot that mutate data (e.g. transfers, waivers) must create approval proposals rather than directly executing mutations.
  - **Rationale**: Mitigate hallucination risk and adhere to organizational dual-control principles.

- **ADR-004: Strict RBAC at API Layer**
  - Frontend hiding is non-authoritative. The backend enforces token-based role verification at endpoint boundaries.
  - Sensitive fee schemas are segregated to prevent accidental payload leaks to trainer roles.

- **ADR-005: Async Database Utilities & Connection Lifecycle**
  - Configured SQLAlchemy 2.0 async engine with connection pooling (`pool_size=10`, `max_overflow=20`, `pool_pre_ping=True`).
  - Implemented safe session rollback lifecycle inside `get_db()`.
  - Added centralized database utilities in `app/database/utils.py` (`init_db`, `test_connection`, `get_database_version`).
  - Added live database connectivity probing to the `/health` endpoint.

- **ADR-006: Core Domain Relational Model Design**
  - Implemented explicit models: `Student`, `Trainer`, `Course`, `Batch`, `BatchEnrollment`, `AttendanceRecord`, `FeeInstallment`.
  - Used `Decimal` (`Numeric(12, 2)`) for all financial amounts (`base_fee`, `amount_due`, `amount_paid`).
  - Added unique constraint on `(student_id, batch_id, session_date)` preventing duplicate attendance records.
  - Added check constraints on fee amounts (`amount_due >= 0`, `amount_paid >= 0`, `amount_paid <= amount_due`).

- **ADR-007: Versioned Asynchronous Alembic Migrations**
  - Integrated Alembic with async engine support (`alembic/env.py`) connected to `settings.DATABASE_URL`.
  - Generated initial migration revision `bf0c27eb0055_create_core_institute_tables.py` and cleanly applied via `alembic upgrade head`.

- **ADR-008: Feature API Client & Async Hook Architecture**
  - Standardized frontend data fetching using feature API clients (`studentsApi.js`, `coursesApi.js`, etc.) wrapping central `apiClient`.
  - Created reusable `useApi` (for automatic query handling with reload) and `useMutation` (for async actions) hooks.
  - Standardized error handling, loading skeleton states, and optimistic / post-mutation invalidation.

- **ADR-009: Robust CORS Origin Parsing in Pydantic v2**
  - Added custom `@field_validator("BACKEND_CORS_ORIGINS", mode="before")` in `config.py` to parse both JSON strings and comma-separated lists from `.env`.
  - Configured CORSMiddleware to always register with validated origin list, eliminating 400 Bad Request on preflight OPTIONS requests.

- **ADR-010: Role-Based Dashboard Architecture (Sprint 3)**
  - Five role-specific dashboard pages under `/dashboard/{role}` routes.
  - Shared `DashboardLayout` + `Sidebar` + `Navbar` used by all roles — no duplicated shell.
  - `RoleGuard.jsx` wraps each dashboard route; wrong-role users are redirected to their own dashboard (not an error page).
  - Role constants, dashboard URL map, and nav item config live in `src/utils/rbac.js` — single source of truth.
  - `AuthProvider` re-validates the JWT with `GET /auth/me` on every page load to prevent stale roles from localStorage being trusted.
  - `DashboardLayout` passes `user.role` to `Sidebar`, which uses `getNavItems(role)` from `rbac.js` for role-specific navigation.

- **ADR-011: Backend Role-Scoped Dashboard Endpoints**
  - New module `backend/app/modules/dashboard/router.py` with five endpoints scoped by role.
  - Financial data is completely absent from trainer and student endpoints (schema-level segregation, not just response filtering).
  - `require_roles()` dependency enforces RBAC independently at every endpoint.

## 2. Current Project State

- **Sprint 3 / Phase 3 (Role-Based Dashboards & Frontend Routing) Completed**:
  - Five role-specific dashboards implemented: Owner, Counselor, Trainer, Accounts, Student.
  - All dashboards use shared `DashboardLayout` + role-aware `Sidebar`.
  - `RoleGuard` protects each dashboard route; unauthenticated → `/login`, wrong role → own dashboard.
  - Login page updated to call real backend (`POST /auth/login`) and redirect to `getDashboardPath(role)`.
  - `AuthProvider` validates token on mount via `GET /auth/me`, protecting page refreshes.
  - Five new backend dashboard endpoints added (`/dashboard/{owner|counselor|trainer|accounts|student}`).
  - Trainer endpoint has zero financial fields — enforced at schema level.
  - Demo credential matrix in auth router enables testing all 5 roles with `admin123`.
  - **Frontend Build**: `npm run build` passes — 1515 modules, exit code 0.
  - **Backend Tests**: 4/4 existing integration tests passing.
  - **Backend Import Check**: New modules import cleanly.

- **Demo Credentials (Phase 3 scaffolding)**:
  | Email | Role |
  |---|---|
  | `owner@edupilot.io` | `super_admin` |
  | `counselor@edupilot.io` | `counselor` |
  | `trainer@edupilot.io` | `trainer` |
  | `accounts@edupilot.io` | `finance` |
  | `student@edupilot.io` | `student` |
  | Password for all: `admin123` |

- **Known Limitations / Next Phase**:
  - Demo credential matrix must be replaced with a real `User` database table, password hashing, and JWT refresh tokens in Phase 4.
  - Student dashboard cannot link to personal attendance/fee records until a `User → Student` FK relationship is added in Phase 4.
  - Counselor follow-up tasks are demo data — requires CRM integration in Phase 4.
  - Trainer class schedule is demo data — requires timetable module in Phase 4.
  - AI Copilot alerts on owner dashboard are demo data — requires Phase 4 LLM integration.

- **Exact Next Recommended Task**:
  - Phase 4 / Auth: Implement `User` model with hashed passwords, JWT refresh tokens, and user-to-role-entity mapping.
  - Phase 4 / Student linking: Add `user_id` FK to `Student` model and filter student dashboard by authenticated user.
  - Attendance daily roster marking UI (Trainer → mark batch attendance).
  - Fee receipts / invoice exports (Accounts dashboard).
