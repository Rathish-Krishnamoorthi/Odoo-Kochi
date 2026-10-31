from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_db, public_document, require_roles
from app.services.resources import audit, create_resource_router

router = create_resource_router("payments")
actions = APIRouter(prefix="/payments", tags=["payments"])


@actions.post("/{payment_id}/refund")
def record_refund(payment_id: str, database=Depends(get_db),
                  user=Depends(require_roles("admin", "staff"))):
    payment = database.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(404, "Payment not found.")
    if payment.get("status") != "completed":
        raise HTTPException(409, "Only completed payments can be refunded.")
    invoice = database.invoices.find_one({"id": payment["invoice_id"]})
    if not invoice:
        raise HTTPException(409, "Payment invoice no longer exists.")
    updated = database.payments.find_one_and_update(
        {"id": payment_id, "status": "completed"},
        {"$set": {"status": "refunded"}}, return_document=True)
    if not updated:
        raise HTTPException(409, "Payment has already been refunded or is no longer completed.")
    revised_invoice = database.invoices.find_one_and_update(
        {"id": invoice["id"], "paid_amount": {"$gte": payment["amount"]}},
        {"$inc": {"paid_amount": -payment["amount"]}}, return_document=True)
    if not revised_invoice:
        database.payments.update_one({"id": payment_id}, {"$set": {"status": "completed"}})
        raise HTTPException(409, "Invoice balance changed; refund was not recorded.")
    paid = revised_invoice["paid_amount"]
    database.invoices.update_one({"id": invoice["id"]}, {"$set": {
        "status": "paid" if paid >= invoice.get("total_amount", 0) else ("partial" if paid else "sent"),
    }})
    audit(database, user, "refund", "payments", payment_id)
    return public_document(updated)
