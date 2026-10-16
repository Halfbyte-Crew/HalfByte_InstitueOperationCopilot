from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.dependencies import require_roles

# Strict role restriction: Only super_admin, admin, and finance can access fee data
router = APIRouter(
    prefix="/fees",
    tags=["Fees & Financials"],
    dependencies=[Depends(require_roles(["super_admin", "admin", "finance"]))]
)


class FeeOverview(BaseModel):
    total_receivable: float
    total_collected: float
    total_outstanding: float
    collection_rate: str


@router.get("/overview", response_model=FeeOverview)
async def get_fee_overview():
    return {
        "total_receivable": 2400000.0,
        "total_collected": 1980000.0,
        "total_outstanding": 420000.0,
        "collection_rate": "82.5%",
    }
