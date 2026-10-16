from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/trainers", tags=["Trainers"])


class TrainerResponse(BaseModel):
    id: str
    name: str
    email: str
    specialization: str


@router.get("", response_model=List[TrainerResponse])
async def list_trainers(current_user: dict = Depends(get_current_user)):
    return [
        {"id": "trn-1", "name": "Dr. Sarah Jenkins", "email": "sarah.j@edupilot.io", "specialization": "Full-Stack Web"},
        {"id": "trn-2", "name": "Prof. David Miller", "email": "david.m@edupilot.io", "specialization": "Machine Learning"},
    ]
