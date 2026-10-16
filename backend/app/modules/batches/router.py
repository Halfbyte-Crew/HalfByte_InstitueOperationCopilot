from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/batches", tags=["Batches"])


class BatchResponse(BaseModel):
    id: str
    code: str
    course_code: str
    trainer_name: str
    capacity: int
    enrolled_count: int


@router.get("", response_model=List[BatchResponse])
async def list_batches(current_user: dict = Depends(get_current_user)):
    return [
        {
            "id": "btc-1",
            "code": "FSW-2026-A",
            "course_code": "FSW",
            "trainer_name": "Dr. Sarah Jenkins",
            "capacity": 30,
            "enrolled_count": 28,
        },
        {
            "id": "btc-2",
            "code": "DSAI-2026-B",
            "course_code": "DSAI",
            "trainer_name": "Prof. David Miller",
            "capacity": 25,
            "enrolled_count": 22,
        },
    ]
