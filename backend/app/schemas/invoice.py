from typing import Optional

from pydantic import BaseModel, Field


class InvoiceLine(BaseModel):
    description: str
    quantity: int = 1
    unit_price: int = 0
    tax_rate: int = 0
    discount_rate: int = 0


class InvoiceCreate(BaseModel):
    customer_id: str
    subscription_id: Optional[str] = None
    invoice_number: str
    due_date: str
    status: str = "draft"
    lines: list[InvoiceLine] = Field(default_factory=list)


class InvoiceOut(InvoiceCreate):
    id: str
    total_amount: int = 0
    paid_amount: int = 0
