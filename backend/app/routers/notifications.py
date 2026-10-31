from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import get_db, public_document, require_roles
from app.services.resources import create_resource_router

router = create_resource_router("notifications")
actions = APIRouter(prefix="/notifications", tags=["notifications"])


@actions.post("/{notification_id}/read")
def mark_read(notification_id: str, database=Depends(get_db),
              user=Depends(require_roles("admin", "staff"))):
    result = database.notifications.find_one_and_update(
        {"id": notification_id}, {"$set": {"status": "read"}}, return_document=True)
    if not result:
        raise HTTPException(404, "Notification not found.")
    return public_document(result)
