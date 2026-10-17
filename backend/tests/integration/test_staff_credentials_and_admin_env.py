"""
Integration tests for Environment-configured Admin Authentication
and Admin-managed Staff Credentials (Counselor, Trainer, Finance).
"""
import pytest
from app.core.config import settings
from app.models.institute import StaffMember, Trainer


@pytest.mark.asyncio
async def test_admin_env_authentication(client):
    """
    1. Verify Admin authentication strictly uses settings.ADMIN_EMAIL and settings.ADMIN_PASSWORD from .env
    """
    # Valid admin credentials from settings
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.ADMIN_EMAIL, "password": settings.ADMIN_PASSWORD},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["user"]["role"] in ["super_admin", "admin"]
    assert "access_token" in data
    assert data["dashboard_url"] == "/dashboard/owner"

    # Invalid admin password rejected
    res_bad = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.ADMIN_EMAIL, "password": "WrongPassword999!"},
    )
    assert res_bad.status_code == 401


@pytest.mark.asyncio
async def test_admin_creates_staff_credentials_and_staff_login(client, db_session):
    """
    2. Admin creates Counselor, Trainer, and Finance staff with passwords.
    3. Each staff member successfully authenticates via /api/v1/auth/login using real DB credentials.
    4. Admin resets credentials, verifying old password is rejected and new password accepted.
    5. Deactivated staff accounts are prevented from logging in.
    """
    # ── A. Admin Creates Counselor with Login Password ───────────────────────
    counselor_payload = {
        "name": "Ananya Sen",
        "email": "ananya.counselor@edupilot.io",
        "role": "counselor",
        "department": "Admissions & Outreach",
        "phone": "+91 91234 56789",
        "password": "CounselorPass123",
    }
    create_counselor_res = await client.post("/api/v1/staff", json=counselor_payload)
    assert create_counselor_res.status_code == 201, create_counselor_res.text
    counselor_data = create_counselor_res.json()
    counselor_id = counselor_data["id"]
    assert counselor_data["has_password"] is True
    # Security check: Password hashes must never be exposed
    assert "password_hash" not in counselor_data
    assert "password" not in counselor_data

    # ── B. Counselor Logs in with Real Database Credentials ──────────────────
    counselor_login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "ananya.counselor@edupilot.io", "password": "CounselorPass123"},
    )
    assert counselor_login_res.status_code == 200, counselor_login_res.text
    login_info = counselor_login_res.json()
    assert login_info["user"]["role"] == "counselor"
    assert login_info["user"]["name"] == "Ananya Sen"
    assert login_info["dashboard_url"] == "/dashboard/counselor"

    # ── C. Admin Creates Trainer with Login Password ─────────────────────────
    trainer_payload = {
        "name": "Dr. Rajesh Kumar",
        "email": "rajesh.trainer@edupilot.io",
        "role": "trainer",
        "department": "Full Stack & Cloud Systems",
        "phone": "+91 92345 67890",
        "password": "TrainerPass123",
    }
    create_trainer_res = await client.post("/api/v1/staff", json=trainer_payload)
    assert create_trainer_res.status_code == 201, create_trainer_res.text

    # Trainer logs in via /api/v1/auth/login
    trainer_login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "rajesh.trainer@edupilot.io", "password": "TrainerPass123"},
    )
    assert trainer_login_res.status_code == 200, trainer_login_res.text
    t_login_info = trainer_login_res.json()
    assert t_login_info["user"]["role"] == "trainer"
    assert t_login_info["user"]["name"] == "Dr. Rajesh Kumar"
    assert t_login_info["dashboard_url"] == "/dashboard/trainer"

    # ── D. Admin Creates Finance/Accounts Staff with Login Password ───────────
    finance_payload = {
        "name": "Sunita Verma",
        "email": "sunita.finance@edupilot.io",
        "role": "finance",
        "department": "Accounts & Fee Collections",
        "phone": "+91 93456 78901",
        "password": "FinancePass123",
    }
    create_finance_res = await client.post("/api/v1/staff", json=finance_payload)
    assert create_finance_res.status_code == 201, create_finance_res.text

    # Finance staff logs in via /api/v1/auth/login
    finance_login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "sunita.finance@edupilot.io", "password": "FinancePass123"},
    )
    assert finance_login_res.status_code == 200, finance_login_res.text
    f_login_info = finance_login_res.json()
    assert f_login_info["user"]["role"] == "finance"
    assert f_login_info["user"]["name"] == "Sunita Verma"
    assert f_login_info["dashboard_url"] == "/dashboard/accounts"

    # ── E. Admin Resets Staff Password ───────────────────────────────────────
    reset_res = await client.post(
        f"/api/v1/staff/{counselor_id}/reset-password",
        json={"password": "NewCounselorPass456"},
    )
    assert reset_res.status_code == 200, reset_res.text

    # Old password fails
    old_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "ananya.counselor@edupilot.io", "password": "CounselorPass123"},
    )
    assert old_login.status_code == 401

    # New password succeeds
    new_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "ananya.counselor@edupilot.io", "password": "NewCounselorPass456"},
    )
    assert new_login.status_code == 200
    assert new_login.json()["user"]["role"] == "counselor"

    # ── F. Admin Deactivates Staff Account -> Login Denied ────────────────────
    toggle_res = await client.post(f"/api/v1/staff/{counselor_id}/toggle-status")
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False

    deactivated_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "ananya.counselor@edupilot.io", "password": "NewCounselorPass456"},
    )
    assert deactivated_login.status_code == 401
    assert "deactivated" in deactivated_login.json()["detail"].lower()
