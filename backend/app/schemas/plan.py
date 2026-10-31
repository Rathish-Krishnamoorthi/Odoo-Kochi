from typing import Optional

from pydantic import BaseModel, Field


class PlanCreate(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    billing_frequency: str = "monthly"
    min_quantity: int = 1
    status: str = "active"
    price: int = Field(..., ge=0)


class PlanOut(PlanCreate):
    id: str
