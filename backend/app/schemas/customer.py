from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    phone: Optional[str] = None
    billing_address: Optional[str] = None
    status: str = "active"


class CustomerOut(CustomerCreate):
    id: str
