# Security Policies & RBAC Matrix - EduPilot

## 1. Security Boundaries
- **No Direct DB Access**: The frontend application strictly interfaces with the FastAPI layer over TLS. PostgreSQL credentials never leave the backend environment.
- **Backend as Source of Truth**: UI elements (disabled buttons, hidden navigation items, conditional renders) are UX affordances only. Every backend endpoint independently authenticates and authorizes the actor.
- **Zero Financial Leakage**: Endpoints serving batch rosters or student profiles to trainers or unauthorized roles must omit fee status, due amounts, and payment histories completely from response schemas.

## 2. Role-Based Access Control (RBAC) Matrix

| Feature / Resource | Super Admin | Admin | Coordinator | Finance | Trainer |
|---|---|---|---|---|---|
| Dashboard Analytics | Full | Full | Academic only | Financial only | Assigned Batches |
| Student Records (CRUD) | Full | Full | Read/Update | Read only | Read assigned |
| Courses & Batches | Full | Full | Full | Read only | Read assigned |
| Attendance Tracking | Full | Full | Full | Read only | Mark assigned |
| Fee Management | Full | Full | No Access | Full | **No Access** |
| AI Operations Copilot | Full | Full | Operational only | Financial only | No Access |
| Action Approvals | Approve/Reject | Submit/Approve | Submit | Submit | No Access |
| Audit Trail Logs | Read | Read | No Access | No Access | No Access |

## 3. Session Management & Cryptography
- Passwords stored using `bcrypt` (minimum 12 rounds) or `argon2`.
- JWT tokens signed with `HS256` or `RS256` with strict expiration (`ACCESS_TOKEN_EXPIRE_MINUTES`).
- Revocation list / blacklisting for compromised sessions stored in cache or DB.
- Sanitized input validation via Pydantic to prevent SQL injection and NoSQL injection attacks.
