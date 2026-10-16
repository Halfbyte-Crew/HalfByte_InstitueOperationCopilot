from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, EmailStr
from app.core.security import create_access_token
from app.core.exceptions import InvalidCredentialsException
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ---------------------------------------------------------------------------
# Phase 3 scaffolding: Demo credential matrix.
# Maps email → (role, display_name).  Replace with real DB lookup in Phase 4.
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

# Dashboard URL for each role (returned in login response as a routing hint)
_ROLE_DASHBOARD: dict[str, str] = {
    "super_admin": "/dashboard/owner",
    "admin": "/dashboard/owner",
    "counselor": "/dashboard/counselor",
    "trainer": "/dashboard/trainer",
    "finance": "/dashboard/accounts",
    "student": "/dashboard/student",
}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    dashboard_url: str


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    email_lower = credentials.email.lower()

    if credentials.password != "admin123":
        raise InvalidCredentialsException("Invalid username or password.")

    if email_lower not in _DEMO_USERS:
        raise InvalidCredentialsException("No demo account found for this email.")

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


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    role = current_user.get("role", "super_admin")
    email = current_user.get("id", "")

    # Derive display name from demo table if available, otherwise fall back
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
    return {"message": "Session terminated successfully."}
