from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user
from app.database.session import get_db
from app.models.institute import Trainer
from app.schemas.institute import TrainerCreate, TrainerResponse, TrainerUpdate

router = APIRouter(prefix="/trainers", tags=["Trainers"])


@router.post("", response_model=TrainerResponse, status_code=status.HTTP_201_CREATED)
async def create_trainer(
    payload: TrainerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    existing = await db.execute(select(Trainer).where(Trainer.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Trainer with email '{payload.email}' already exists.",
        )

    trainer = Trainer(**payload.model_dump())
    db.add(trainer)
    await db.commit()
    await db.refresh(trainer)
    return trainer


@router.get("", response_model=List[TrainerResponse])
async def list_trainers(
    search: Optional[str] = Query(None, description="Search by name, email, or specialization"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    stmt = select(Trainer)
    if search:
        s = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            (func.lower(Trainer.name).like(s))
            | (func.lower(Trainer.email).like(s))
            | (func.lower(Trainer.specialization).like(s))
        )
    stmt = stmt.order_by(Trainer.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{trainer_id}", response_model=TrainerResponse)
async def get_trainer(
    trainer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    trainer = await db.get(Trainer, trainer_id)
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trainer with id '{trainer_id}' not found.",
        )
    return trainer


@router.patch("/{trainer_id}", response_model=TrainerResponse)
async def update_trainer(
    trainer_id: uuid.UUID,
    payload: TrainerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    trainer = await db.get(Trainer, trainer_id)
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trainer with id '{trainer_id}' not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] != trainer.email:
        existing = await db.execute(
            select(Trainer).where(Trainer.email == update_data["email"], Trainer.id != trainer_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{update_data['email']}' is already in use.",
            )

    for field, value in update_data.items():
        setattr(trainer, field, value)

    await db.commit()
    await db.refresh(trainer)
    return trainer
