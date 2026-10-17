"""
Staff Management API router.
Strictly restricted to 'super_admin' and 'admin' roles.
Guards against admin lockout and self-deactivation.
"""
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.institute import StaffMember
from app.schemas.institute import (
    StaffMemberCreate,
    StaffMemberResponse,
    StaffMemberUpdate,
)

router = APIRouter(
    prefix="/staff",
    tags=["Staff Management"],
    dependencies=[Depends(require_roles(["super_admin", "admin"]))],
)

PERMITTED_ROLES = {"admin", "counselor", "coordinator", "trainer", "finance"}


@router.get("", response_model=List[StaffMemberResponse])
async def list_staff(
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Staff directory with search, role filter, status filter, and pagination."""
    stmt = select(StaffMember)

    if search:
        s = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(StaffMember.name).like(s),
                func.lower(StaffMember.email).like(s),
            )
        )

    if role:
        stmt = stmt.where(StaffMember.role == role.strip().lower())

    if is_active is not None:
        stmt = stmt.where(StaffMember.is_active == is_active)

    stmt = stmt.order_by(StaffMember.name.asc()).offset(skip).limit(limit)
    results = (await db.execute(stmt)).scalars().all()
    return list(results)


@router.post("", response_model=StaffMemberResponse, status_code=status.HTTP_201_CREATED)
async def create_staff(
    payload: StaffMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create or invite a new staff member."""
    email_normalized = str(payload.email).strip().lower()
    existing = await db.execute(
        select(StaffMember).where(StaffMember.email == email_normalized)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Staff member with email '{email_normalized}' already exists.",
        )

    role_normalized = payload.role.strip().lower()
    if role_normalized not in PERMITTED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{payload.role}'. Permitted roles are: {sorted(list(PERMITTED_ROLES))}",
        )

    data = payload.model_dump()
    data["email"] = email_normalized
    data["role"] = role_normalized
    staff = StaffMember(**data)
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return staff


@router.get("/{staff_id}", response_model=StaffMemberResponse)
async def get_staff_detail(
    staff_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """View details of a single staff member."""
    staff = await db.get(StaffMember, staff_id)
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff member '{staff_id}' not found.",
        )
    return staff


@router.patch("/{staff_id}", response_model=StaffMemberResponse)
async def update_staff(
    staff_id: uuid.UUID,
    payload: StaffMemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Update permitted staff information.
    Guards against removing the last admin or an administrator removing their own admin role.
    """
    staff = await db.get(StaffMember, staff_id)
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff member '{staff_id}' not found.",
        )

    data = payload.model_dump(exclude_unset=True)

    # Check role change safety
    if "role" in data and data["role"] is not None:
        new_role = data["role"].strip().lower()
        if new_role not in PERMITTED_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role '{data['role']}'. Permitted roles: {sorted(list(PERMITTED_ROLES))}",
            )

        # If demoting an admin:
        if staff.role == "admin" and new_role != "admin":
            # Guard 1: Current user cannot demote themselves
            current_user_email = current_user.get("id", "").lower()
            if staff.email.lower() == current_user_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Security restriction: You cannot remove your own administrative access.",
                )

            # Guard 2: Must not leave zero active admins
            active_admin_count = (
                await db.execute(
                    select(func.count(StaffMember.id)).where(
                        StaffMember.role == "admin",
                        StaffMember.is_active == True,
                        StaffMember.id != staff_id,
                    )
                )
            ).scalar() or 0

            if active_admin_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Security restriction: Cannot remove the last active administrator.",
                )

        data["role"] = new_role

    for field, val in data.items():
        setattr(staff, field, val)

    await db.commit()
    await db.refresh(staff)
    return staff


@router.post("/{staff_id}/toggle-status", response_model=StaffMemberResponse)
async def toggle_staff_status(
    staff_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Activate or deactivate a staff member account.
    Guards against self-deactivation and leaving zero active admins.
    """
    staff = await db.get(StaffMember, staff_id)
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff member '{staff_id}' not found.",
        )

    # If deactivating:
    if staff.is_active:
        current_user_email = current_user.get("id", "").lower()
        if staff.email.lower() == current_user_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security restriction: You cannot deactivate your own administrative account.",
            )

        if staff.role == "admin":
            active_admins = (
                await db.execute(
                    select(func.count(StaffMember.id)).where(
                        StaffMember.role == "admin",
                        StaffMember.is_active == True,
                        StaffMember.id != staff_id,
                    )
                )
            ).scalar() or 0

            if active_admins == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Security restriction: Cannot deactivate the last remaining administrator.",
                )

        staff.is_active = False
    else:
        staff.is_active = True

    await db.commit()
    await db.refresh(staff)
    return staff
