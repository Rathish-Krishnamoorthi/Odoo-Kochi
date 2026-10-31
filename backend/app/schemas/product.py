from typing import Optional

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    product_type: str = "software"
    sales_price: int = Field(..., ge=0)
    cost_price: int = Field(..., ge=0)
    status: str = "active"


class ProductOut(ProductCreate):
    id: str
