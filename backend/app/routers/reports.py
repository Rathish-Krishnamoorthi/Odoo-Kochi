from fastapi import APIRouter, Depends

from app.core.dependencies import get_db, public_document, require_roles

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard")
def dashboard(database=Depends(get_db), user=Depends(require_roles("admin", "staff"))):
    invoices = list(database.invoices.find({}, {"total_amount": 1, "paid_amount": 1, "status": 1}))
    revenue = sum(int(item.get("paid_amount", 0)) for item in invoices)
    return {
        "active_subscriptions": database.subscriptions.count_documents({"status": "active"}),
        "customers": database.customers.count_documents({}),
        "products": database.products.count_documents({}),
        "overdue_invoices": database.invoices.count_documents({"status": "overdue"}),
        "total_revenue": revenue,
        "outstanding_amount": sum(max(0, int(item.get("total_amount", 0)) - int(item.get("paid_amount", 0))) for item in invoices),
    }


@router.get("/revenue")
def revenue(database=Depends(get_db), user=Depends(require_roles("admin", "staff"))):
    documents = list(database.invoices.find({}, {"total_amount": 1, "paid_amount": 1}))
    return {"total_revenue": sum(int(item.get("paid_amount", 0)) for item in documents),
            "invoiced_amount": sum(int(item.get("total_amount", 0)) for item in documents),
            "count": len(documents)}


@router.get("/overdue")
def overdue(database=Depends(get_db), user=Depends(require_roles("admin", "staff"))):
    query = {"status": "overdue"}
    invoices = database.invoices.find(query).sort("due_date", 1)
    return {"invoices": [public_document(invoice) for invoice in invoices],
            "count": database.invoices.count_documents(query)}
