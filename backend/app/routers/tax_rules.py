from app.services.resources import create_resource_router

router = create_resource_router("tax_rules", path="tax-rules", admin_write=True)
