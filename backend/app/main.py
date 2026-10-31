from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.auth import router as auth_router
from app.routers.customers import router as customers_router
from app.routers.health import router as health_router
from app.routers.invoices import router as invoices_router
from app.routers.plans import router as plans_router
from app.routers.products import router as products_router
from app.routers.reports import router as reports_router
from app.routers.subscriptions import router as subscriptions_router
from app.routers.users import router as users_router

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Subscription Management System for Brightloop Software",
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


@app.get("/")
def root():
    return {"message": "Brightloop Subscription Management API"}
