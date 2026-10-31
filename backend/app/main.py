from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import close_database, connect_database, ensure_indexes, ensure_initial_admin
from app.routers.audit_logs import router as audit_logs_router
from app.routers.auth import router as auth_router
from app.routers.customers import router as customers_router
from app.routers.discounts import router as discounts_router
from app.routers.health import router as health_router
from app.routers.invoices import router as invoices_router
from app.routers.notifications import actions as notification_actions_router
from app.routers.notifications import router as notifications_router
from app.routers.payments import router as payments_router
from app.routers.payments import actions as payment_actions_router
from app.routers.plans import router as plans_router
from app.routers.products import router as products_router
from app.routers.quotations import conversion_router as quotation_conversion_router
from app.routers.quotations import router as quotations_router
from app.routers.reports import router as reports_router
from app.routers.subscriptions import router as subscriptions_router
from app.routers.tax_rules import router as tax_rules_router
from app.routers.users import router as users_router


@asynccontextmanager
async def lifespan(application: FastAPI):
    try:
        database = connect_database()
        ensure_indexes(database)
        ensure_initial_admin(database)
        application.state.db = database
        yield
    finally:
        application.state.db = None
        close_database()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Subscription Management System for Brightloop Software",
    lifespan=lifespan,
)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(customers_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(plans_router, prefix="/api/v1")
app.include_router(subscriptions_router, prefix="/api/v1")
app.include_router(invoices_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(payment_actions_router, prefix="/api/v1")
app.include_router(quotations_router, prefix="/api/v1")
app.include_router(quotation_conversion_router, prefix="/api/v1")
app.include_router(discounts_router, prefix="/api/v1")
app.include_router(tax_rules_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(notification_actions_router, prefix="/api/v1")
app.include_router(audit_logs_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Brightloop Subscription Management API"}
