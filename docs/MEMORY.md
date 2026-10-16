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

## 2. Current Project State
- **Sprint 2 / Phase 2 (Core Institute Layer & Frontend Integration) Completed**:
  - Full relational PostgreSQL schema and Alembic migrations.
  - Core domain APIs (Students, Courses, Batches, Trainers, Attendance, Fees) operational with Pydantic schemas.
  - Live frontend integration complete for Students, Courses, Batches, Trainers, and Fees pages.
  - CORS preflight issue completely resolved.
  - Database seed script (`python -m scripts.seed_data`) creates realistic demo records.
  - Automated Tests: 4/4 integration tests passing in `tests/integration/test_institute_core.py`.
  - Frontend Build: `npm run build` passes with zero errors.
- **Exact Next Recommended Task**:
  - Phase 3 / Auth: Full user authentication (JWT login/refresh/logout screens and backend tokens).
  - Attendance daily roster marking UI.
  - Fee receipts / invoice exports.
