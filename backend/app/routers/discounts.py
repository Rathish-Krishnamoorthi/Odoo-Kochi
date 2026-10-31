from app.services.resources import create_resource_router

router = create_resource_router("discounts", admin_write=True)
