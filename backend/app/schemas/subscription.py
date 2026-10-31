from typing import Optional

from pydantic import BaseModel, Field


class SubscriptionLine(BaseModel):
    product_id: str
    quantity: int = 1
    unit_price: int = 0
    tax_rate: int = 0
    discount_rate: int = 0


class SubscriptionCreate(BaseModel):
    customer_id: str
    plan_id: str
    start_date: str
    expiry_date: Optional[str] = None
    status: str = "draft"
    lines: list[SubscriptionLine] = Field(default_factory=list)


class SubscriptionOut(SubscriptionCreate):
    id: str
    subscription_number: str
