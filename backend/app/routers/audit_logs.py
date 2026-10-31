from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_db, public_document, require_roles

router = APIRouter(prefix="/audit-logs", tags=["audit logs"])


@router.get("")
@router.get("/")
def list_audit_logs(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
                    database=Depends(get_db), user=Depends(require_roles("admin"))):
    total = database.audit_logs.count_documents({})
    records = database.audit_logs.find({}).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size)
    return {"items": [public_document(item) for item in records],
            "meta": {"page": page, "page_size": page_size, "total": total}}
