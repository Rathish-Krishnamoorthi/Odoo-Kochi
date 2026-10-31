from fastapi import APIRouter, HTTPException, status

from app.schemas.invoice import InvoiceCreate, InvoiceOut
from app.services.billing import calculate_invoice_totals

router = APIRouter(prefix="/invoices", tags=["invoices"])

invoices_db: list[dict] = []


@router.get("/", response_model=list[InvoiceOut])
def list_invoices():
    return [InvoiceOut(**invoice) for invoice in invoices_db]


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=InvoiceOut)
def create_invoice(payload: InvoiceCreate):
    item_total = 0
    for line in payload.lines:
        totals = calculate_invoice_totals(line.unit_price, line.tax_rate, line.discount_rate, line.quantity)
        item_total += totals["total"]
    invoice = {
        "id": f"invoice_{len(invoices_db) + 1}",
        "total_amount": item_total,
        "paid_amount": 0,
        **payload.model_dump(),
    }
    invoices_db.append(invoice)
    return InvoiceOut(**invoice)


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: str):
    invoice = next((item for item in invoices_db if item["id"] == invoice_id), None)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    return InvoiceOut(**invoice)
