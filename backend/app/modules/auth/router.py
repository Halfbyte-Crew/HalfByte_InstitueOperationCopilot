"""
Authentication Router for EduPilot Institute Operations.
Handles JWT token generation, role-based session establishment,
and secure student account activation workflows.
"""
from datetime import datetime, timezone
import hashlib
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.exceptions import InvalidCredentialsException
from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.institute import Student, StudentAccount

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ---------------------------------------------------------------------------
# Demo Credentials Matrix (Phase 3 scaffolding)
# Maps authorized staff email addresses to their respective roles and display names.
# Real student accounts are verified directly against the PostgreSQL database.
# ---------------------------------------------------------------------------
_DEMO_USERS: dict[str, tuple[str, str]] = {
    # Owner / super admin
    "owner@edupilot.io": ("super_admin", "Institute Director"),
    "admin@edupilot.io": ("super_admin", "Institute Administrator"),
    # Counselor / coordinator
    "counselor@edupilot.io": ("counselor", "Priya Sharma"),
    "coordinator@edupilot.io": ("counselor", "Ravi Nair"),
    # Trainer
    "trainer@edupilot.io": ("trainer", "Prof. Anita Desai"),
    # Accounts / finance
    "accounts@edupilot.io": ("finance", "Finance Manager"),
    "finance@edupilot.io": ("finance", "Accounts Officer"),
    # Student (demo)
    "student@edupilot.io": ("student", "Demo Student"),
}

# Role to dashboard URL mapping used for frontend routing hints
_ROLE_DASHBOARD: dict[str, str] = {
    "super_admin": "/dashboard/owner",
    "admin": "/dashboard/owner",
    "counselor": "/dashboard/counselor",
    "trainer": "/dashboard/trainer",
    "finance": "/dashboard/accounts",
    "student": "/dashboard/student",
}


# ---------------------------------------------------------------------------
# Request & Response Schemas
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    """Credentials payload submitted to the login endpoint."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Standard JWT access token response with user profile and redirect hint."""
    access_token: str
    token_type: str = "bearer"
    user: dict
    dashboard_url: str


class ActivateStudentRequest(BaseModel):
    """Payload to activate a newly provisioned student account."""
    token: str
    password: str = Field(..., min_length=6, max_length=128)


class ActivationVerifyResponse(BaseModel):
    """Response returned when validating a student invitation token."""
    valid: bool
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    message: str


# ---------------------------------------------------------------------------
# Authentication Endpoints
# ---------------------------------------------------------------------------
@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate user and issue a signed JWT access token.
    1. First checks the database for real student accounts created by trainers/admins.
    2. Verifies account activation status and bcrypt password hash.
    3. Falls back to demo credentials matrix for administrative/staff profiles.
    """
    email_lower = credentials.email.lower().strip()

    # ── 1. Check Real Student Accounts in Database ───────────────────────────
    stmt = (
        select(StudentAccount)
        .options(selectinload(StudentAccount.student))
        .where(func.lower(StudentAccount.email) == email_lower)
    )
    result = await db.execute(stmt)
    account = result.scalar_one_or_none()

    if account:
        # Enforce that the account must have completed the activation flow
        if account.account_status != "active" or not account.is_active:
            raise InvalidCredentialsException(
                "Account is pending activation. Please use your activation link to set your password."
            )
        # Verify password using direct bcrypt verification
        if not account.password_hash or not verify_password(credentials.password, account.password_hash):
            raise InvalidCredentialsException("Invalid username or password.")

        # Update last login timestamp for audit tracking
        account.last_login_at = datetime.now(timezone.utc)
        await db.commit()

        display_name = account.student.name if account.student else "Student"
        token = create_access_token(subject=email_lower, role="student")

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(account.student_id),
                "email": email_lower,
                "name": display_name,
                "role": "student",
            },
            "dashboard_url": _ROLE_DASHBOARD.get("student", "/dashboard/student"),
        }

    # ── 2. Fall Back to Demo Staff Credentials Matrix ────────────────────────
    if credentials.password != "admin123":
        raise InvalidCredentialsException("Invalid username or password.")

    if email_lower not in _DEMO_USERS:
        raise InvalidCredentialsException("No account found for this email address.")

    role, display_name = _DEMO_USERS[email_lower]
    token = create_access_token(subject=email_lower, role=role)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": f"demo-{role}",
            "email": email_lower,
            "name": display_name,
            "role": role,
        },
        "dashboard_url": _ROLE_DASHBOARD.get(role, "/dashboard/owner"),
    }


def _is_token_expired(expires_at: Optional[datetime]) -> bool:
    """Helper: checks whether a timestamp is in the past, handling offset-aware/naive datetimes."""
    if not expires_at:
        return False
    if expires_at.tzinfo is None:
        return expires_at < datetime.now(timezone.utc).replace(tzinfo=None)
    return expires_at < datetime.now(timezone.utc)


@router.get("/verify-activation", response_model=ActivationVerifyResponse)
async def verify_activation(
    token: str = Query(..., description="Single-use activation token"),
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint: Validates whether an activation token exists and has not expired.
    Hashes the raw input token using SHA-256 to compare against the stored hash.
    """
    token_hash = hashlib.sha256(token.strip().encode("utf-8")).hexdigest()
    stmt = (
        select(StudentAccount)
        .options(selectinload(StudentAccount.student))
        .where(StudentAccount.activation_token_hash == token_hash)
    )
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()

    if not account:
        return ActivationVerifyResponse(
            valid=False,
            message="Invalid or already used activation token.",
        )

    if _is_token_expired(account.activation_token_expires_at):
        return ActivationVerifyResponse(
            valid=False,
            message="This activation token has expired. Please ask your trainer to regenerate your activation link.",
        )

    student_name = account.student.name if account.student else "Student"
    return ActivationVerifyResponse(
        valid=True,
        student_name=student_name,
        student_email=account.email,
        message="Token is valid. Set your new password to activate your account.",
    )


@router.post("/activate-student", response_model=TokenResponse)
async def activate_student(payload: ActivateStudentRequest, db: AsyncSession = Depends(get_db)):
    """
    Public single-use student activation endpoint.
    1. Validates the SHA-256 hash of the activation token.
    2. Ensures the 48-hour expiration window has not passed.
    3. Securely hashes the student's chosen password with bcrypt.
    4. Marks account status as 'active' and invalidates the token to prevent replay attacks.
    5. Issues a JWT access token immediately so the student is authenticated upon arrival.
    """
    # ── 1. Validate Token Hash ──────────────────────────────────────────────
    token_hash = hashlib.sha256(payload.token.strip().encode("utf-8")).hexdigest()
    stmt = (
        select(StudentAccount)
        .options(selectinload(StudentAccount.student))
        .where(StudentAccount.activation_token_hash == token_hash)
    )
    res = await db.execute(stmt)
    account = res.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired activation token.",
        )

    # ── 2. Check Expiry ─────────────────────────────────────────────────────
    if _is_token_expired(account.activation_token_expires_at):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Activation token has expired. Please request a new activation link from your trainer.",
        )

    # ── 3. Hash Password & Transition Status ────────────────────────────────
    now = datetime.now(timezone.utc)
    account.password_hash = get_password_hash(payload.password)
    account.is_active = True
    account.account_status = "active"
    account.activated_at = now

    # ── 4. Invalidate Token (Single-Use Guarantee) ───────────────────────────
    account.activation_token_hash = None
    account.activation_token_expires_at = None
    account.last_login_at = now

    await db.commit()
    await db.refresh(account)

    # ── 5. Issue JWT Session ────────────────────────────────────────────────
    display_name = account.student.name if account.student else "Student"
    token = create_access_token(subject=account.email, role="student")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(account.student_id),
            "email": account.email,
            "name": display_name,
            "role": "student",
        },
        "dashboard_url": _ROLE_DASHBOARD.get("student", "/dashboard/student"),
    }


@router.get("/me")
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns profile information for the currently authenticated session.
    Retrieves real student names for student accounts from the database.
    """
    role = current_user.get("role", "super_admin")
    email = current_user.get("id", "")

    # If student role, retrieve their actual registered name
    display_name = None
    if role == "student":
        stmt = select(Student).where(func.lower(Student.email) == str(email).lower())
        res = await db.execute(stmt)
        stu = res.scalar_one_or_none()
        if stu:
            display_name = stu.name

    if not display_name:
        _, display_name = _DEMO_USERS.get(email, (role, "Institute User"))

    return {
        "id": email,
        "email": email,
        "role": role,
        "name": display_name,
        "dashboard_url": _ROLE_DASHBOARD.get(role, "/dashboard/owner"),
    }


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(current_user: dict = Depends(get_current_user)):
    """Logs out user; client side clears localStorage token."""
    return {"message": "Session terminated successfully."}
