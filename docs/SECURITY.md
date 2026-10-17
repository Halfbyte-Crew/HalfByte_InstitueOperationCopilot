# Security Architecture, Cryptography & RBAC Matrix - EduPilot

## 1. Security Philosophy & Principles
EduPilot is built with security as a foundational layer rather than an afterthought. The platform enforces the following core security tenets:

1. **Backend as the Single Source of Truth**: UI elements (hidden navigation tabs, disabled buttons) are strictly user experience enhancements. The FastAPI backend validates every actor's token and role on every private request.
2. **Zero Financial Leakage**: Faculty members and students must never have visibility into tuition fees, discounts, installment aging, or payment receipts for other students or the overall institute.
3. **Defense in Depth**: Security controls operate at multiple boundaries: Network / CORS, JWT Token Verification, Route Dependencies, Pydantic Schema Filtering, and Database Constraints.
4. **Least Privilege Access**: Users receive the minimum permissions necessary to perform their operational duties.

---

## 2. Role-Based Access Control (RBAC) Matrix

EduPilot defines 5 primary institutional roles with explicit access boundaries:

| Resource / Endpoint Domain | Super Admin (`super_admin`) | Academic Counselor (`counselor`) | Trainer / Faculty (`trainer`) | Finance / Accounts (`finance`) | Student (`student`) |
|---|---|---|---|---|---|
| **System Overview & KPIs** | Full (All Metrics) | No Access | No Access | No Access | No Access |
| **Staff & Credential Provisioning** | Full (CRUD + Password Reset) | No Access | No Access | No Access | No Access |
| **Operational Conflicts** | Full (Read / Resolve) | No Access | No Access | No Access | No Access |
| **Action Approvals Queue** | Full (Approve / Reject) | Submit Requests | Submit Requests | Submit Requests | No Access |
| **Inquiries & Leads (CRM)** | Full | Full (CRUD) | No Access | Read Only | No Access |
| **Student Profiles** | Full | Read / Create | Read Assigned Batches | Read Billing Info | Read Own Profile |
| **Courses & Curriculum** | Full | Read Only | Read Assigned | Read Only | Read Enrolled |
| **Batches & Timetable** | Full | Read Only | Read Assigned Batches | Read Only | Read Enrolled |
| **Attendance Recording** | Full | Read Only | **Mark Assigned Batches** | Read Only | View Own Attendance |
| **Fee Installments & Aging** | Full | **NO ACCESS** | **NO ACCESS** | **FULL (CRUD)** | **View Own Dues Only** |
| **Payment Reconciliation** | Full | **NO ACCESS** | **NO ACCESS** | **FULL** | **NO ACCESS** |
| **Financial Reports (CSV)** | Full | **NO ACCESS** | **NO ACCESS** | **FULL** | **NO ACCESS** |
| **Student Account Activation** | Full | No Access | Generate Invite Tokens | No Access | Activate Own Password |
| **RAG Copilot - General Policies** | Full | Full | Full | Full | Full |
| **RAG Copilot - Internal HR / Payroll** | Full | No Access | No Access | Read Only | **NO ACCESS** |

---

## 3. Authentication & Credential Architecture

```
                    ┌───────────────────────────────┐
                    │  User Submits Email/Password  │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Is Email Root Administrator?  │
                    │   (admin@edupilot.io / .env)  │
                    └───────┬───────────────┬───────┘
                            │               │
                     YES ───┘               └─── NO
                     ▼                           ▼
        ┌─────────────────────────┐ ┌─────────────────────────┐
        │ Verify against .env     │ │ Look up in PostgreSQL   │
        │ ADMIN_PASSWORD or       │ │ `staff_members` or      │
        │ hardcoded fallback      │ │ `student_accounts`      │
        └────────────┬────────────┘ └────────────┬────────────┘
                     │                           │
                     ▼                           ▼
        ┌─────────────────────────┐ ┌─────────────────────────┐
        │ Passwords Match?        │ │ Verify Bcrypt Hash      │
        └────────────┬────────────┘ └────────────┬────────────┘
                     │                           │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │   Issue Signed JWT Token      │
                   │  Payload: {sub, role, exp}    │
                   └───────────────────────────────┘
```

### 3.1 Administrator Root Credentials
- Primary Administrator credentials are read directly from `backend/.env` via `settings.ADMIN_EMAIL` and `settings.ADMIN_PASSWORD`.
- To ensure operational continuity during environment migrations, a permanent fallback root (`admin@edupilot.io` / `admin123`) is hardcoded in the auth router.

### 3.2 Staff Accounts (`staff_members`)
- Staff accounts are created dynamically by the Administrator via the Staff Directory UI.
- Passwords are never stored as plain text; they are hashed using **Bcrypt** with 12 computational rounds.
- Passwords can be updated or reset at any time by the Administrator through the dedicated `POST /api/v1/staff/{id}/reset-password` endpoint.

### 3.3 Student Accounts (`student_accounts`)
- Student accounts are created by Trainers or Admins for enrolled students.
- Accounts are provisioned with an inactive state and a single-use cryptographically secure activation token.
- Students click their activation link and submit their chosen password to `POST /api/v1/auth/activate-student` to activate their account.

### 3.4 Login Resilience & Typo Protection
To prevent accidental lockouts caused by mobile autocorrect or minor keyboard slips:
- **Email Typo Normalization**: Automatic fallback resolution between `gamail.com` and `gmail.com`.
- **Password Case Tolerance**: Falls back across exact, stripped, lowercase, and capitalized variations for staff accounts.

---

## 4. Cryptographic Standards & Token Specifications

### 4.1 JWT Access Tokens
- **Algorithm**: `HS256` (HMAC with SHA-256)
- **Token Secret**: Configured via `SECRET_KEY` in `backend/.env`.
- **Default Lifespan**: 1440 minutes (24 hours) for development; configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`.
- **Claims Payload Structure**:
  ```json
  {
    "sub": "counselor@edupilot.io",
    "role": "counselor",
    "exp": 1729267200,
    "iat": 1729180800
  }
  ```

### 4.2 Password Storage
- Password hashing is powered by `passlib.context.CryptContext` using the `bcrypt` hashing scheme.
- Verification is time-constant to mitigate timing attack vectors.

---

## 5. Network & Browser Security (CORS)

Modern Chromium-based browsers enforce **Private Network Access (PNA)** rules when web clients communicate with localhost or internal endpoints.
- EduPilot's `CORSMiddleware` in `backend/app/main.py` explicitly enables:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=origins,
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
      allow_private_network=True,  # Resolves 400 Bad Request on Chrome PNA preflight
  )
  ```
- Cross-Origin Resource Sharing (CORS) origins are strictly validated using Pydantic field validators in `backend/app/core/config.py`.
