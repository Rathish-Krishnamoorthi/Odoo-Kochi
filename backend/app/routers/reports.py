from fastapi import APIRouter

from app.routers.customers import customers_db
from app.routers.invoices import invoices_db
from app.routers.products import products_db
from app.routers.subscriptions import subscriptions_db
from app.services.reports import build_dashboard_snapshot

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard")
def dashboard():
    return build_dashboard_snapshot(customers_db, products_db, subscriptions_db, invoices_db)


@router.get("/revenue")
def revenue():
    return {
        "total_revenue": sum(int(item.get("total_amount", 0)) for item in invoices_db),
        "count": len(invoices_db),
    }
