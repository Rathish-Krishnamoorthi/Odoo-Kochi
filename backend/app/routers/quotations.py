from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from app.core.dependencies import get_db, public_document, require_roles
from app.services.resources import audit, create_resource_router

router = create_resource_router("quotations")
conversion_router = APIRouter(prefix="/quotations", tags=["quotations"])


@conversion_router.post("/{quotation_id}/convert", status_code=201)
def convert_quotation(quotation_id: str, database=Depends(get_db),
                      user=Depends(require_roles("admin", "staff"))):
    quotation = database.quotations.find_one({"id": quotation_id})
    if not quotation:
        raise HTTPException(404, "Quotation not found.")
    existing = database.invoices.find_one({"quotation_id": quotation_id})
    if existing:
        return public_document(existing)
    if quotation.get("status") not in {"accepted", "sent"}:
        raise HTTPException(409, "Only accepted or sent quotations can be converted.")
    invoice = {
        "id": uuid4().hex,
        "invoice_number": f"INV-{uuid4().hex[:8].upper()}",
        "customer_id": quotation["customer_id"],
        "quotation_id": quotation_id,
        "due_date": quotation.get("expiry_date"),
        "status": "draft",
        "lines": quotation.get("lines", []),
        "total_amount": quotation.get("total_amount", 0),
        "subtotal_amount": quotation.get("subtotal_amount", 0),
        "discount_amount": quotation.get("discount_amount", 0),
        "tax_amount": quotation.get("tax_amount", 0),
        "paid_amount": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        database.invoices.insert_one(invoice)
    except DuplicateKeyError as exc:
        raise HTTPException(409, "Quotation has already been converted.") from exc
    database.quotations.update_one({"id": quotation_id}, {"$set": {"status": "converted"}})
    audit(database, user, "convert", "quotations", quotation_id)
    return public_document(invoice)
