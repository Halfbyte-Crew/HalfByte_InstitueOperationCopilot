# Engineering Rules, Standards & Conventions - EduPilot

## 1. Core Engineering Principles
1. **Single Source of Truth**: Backend domain services and PostgreSQL models are the sole authoritative sources for system state. The client application must never maintain independent, out-of-sync mutation logic.
2. **Strict Role-Based Data Isolation**: APIs must strictly omit unauthorized fields at the Pydantic schema level. Frontends hiding fields via CSS or ternary operators are non-authoritative.
3. **Immutability of Audit Trails**: Financial payment records, approval decisions, and attendance entries must never be hard-deleted from the database without a supervisor audit record.
4. **Idempotent Database Migrations & Seeds**: Database migration scripts (Alembic) and seed scripts (`seed_data.py`, `seed_admin_data.py`) must be completely repeatable without causing unique constraint collisions.

---

## 2. Backend Coding Standards (Python & FastAPI)

### 2.1 File & Module Organization
- Modules reside strictly in `backend/app/modules/{domain_name}/`.
- Routers must define their prefix and tags: `router = APIRouter(prefix="/{domain}", tags=["{Domain}"])`.
- Database operations must be asynchronous using SQLAlchemy 2.0 select statements (`select(Model).where(...)`). Never use legacy query syntax (`db.query(Model)`).

### 2.2 Typing & Schemas
- Every endpoint parameter and return type must have explicit Python type annotations.
- Endpoints must declare `response_model` using a Pydantic v2 schema. Raw SQLAlchemy models must never be returned directly in route responses.
- All monetary fields must use Python `Decimal` / SQLAlchemy `Numeric(12, 2)` to avoid floating-point precision loss.

### 2.3 Error Handling & Exceptions
- Throw domain exceptions defined in `app.core.exceptions`:
  - `NotFoundException` for missing entities (maps to HTTP 404).
  - `InvalidCredentialsException` for authentication failures (maps to HTTP 401).
  - `ForbiddenException` for permission rejections (maps to HTTP 403).
  - `ConflictException` for duplicate records (maps to HTTP 409).
- Handlers in `app/main.py` convert domain exceptions into RFC-7807 uniform JSON error responses:
  ```json
  {
    "detail": "Error message description",
    "error_code": "RESOURCE_NOT_FOUND"
  }
  ```

---

## 3. Frontend Coding Standards (React & Vite)

### 3.1 Feature-First Structure
- Features reside strictly in `frontend/src/features/{feature}/`.
- Feature-specific subcomponents and API calls belong inside the feature folder, not in global folders:
  - `src/features/{feature}/pages/`
  - `src/features/{feature}/components/`
  - `src/features/{feature}/{feature}Api.js`
- Global reusable components in `src/components/ui/` or `src/components/common/` must NEVER import from `src/features/`.

### 3.2 HTTP Client Usage
- Never use raw `fetch()` or `axios` directly in React components.
- Use the centralized `apiClient.js` inside dedicated feature API files (e.g. `studentsApi.js`, `staffApi.js`).
- The API client automatically attaches the `Authorization: Bearer <token>` header and handles 401 token expiry redirects.

### 3.3 State & Hook Conventions
- Wrap async data fetching in reusable custom hooks (`useApi`) or `useEffect` with proper cancellation and error catch blocks.
- Every data view must render the 4 states: Loading, Success, Empty, and Error.
- Avoid multi-second unskippable animations or intrusive popups.

---

## 4. Database & Migration Rules (Alembic & PostgreSQL)

1. **Explicit Foreign Key Constraints**: All relationships must specify `ondelete="CASCADE"` or `ondelete="RESTRICT"` intentionally.
2. **Uniqueness & Check Constraints**: Unique indices must be applied to business keys (e.g. course codes, student registration numbers, composite session attendance).
3. **Migration Workflow**:
   - Every schema change requires a versioned Alembic migration file under `backend/migrations/versions/`.
   - Never edit existing, previously applied migration files. Create a new revision (`alembic revision --autogenerate -m "description"`).
   - Test migrations in both directions (`alembic upgrade head` followed by `alembic downgrade -1`).

---

## 5. Security & RBAC Boundary Rules

1. **Trainer Data Boundary**: Endpoints returning student details to trainers must NEVER serialize fee balances, payment histories, or discounts.
2. **Admin Environment Isolation**: The primary Administrator login must always be loaded from `.env` with a hardcoded fallback (`admin@edupilot.io` / `admin123`) to ensure systems are never locked out during setup.
3. **Staff Password Security**: Plaintext passwords must never appear in server logs, API responses, or database records. Only Bcrypt password hashes are persisted.

---

## 6. Git & Pull Request Checklist

Before merging or committing code to branches:
- [ ] Backend test suite passes cleanly (`pytest tests -v`).
- [ ] Frontend builds with zero compiler errors (`npm run build`).
- [ ] No `.env` secrets, credentials, or private keys are staged in git.
- [ ] Conventional Commit format used: `feat(...)`, `fix(...)`, `docs(...)`, `refactor(...)`.
