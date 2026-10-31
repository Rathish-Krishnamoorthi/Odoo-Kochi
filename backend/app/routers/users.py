from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError

from app.core.dependencies import current_user, get_db, public_document, require_roles
from app.core.security import hash_password
from app.services.resources import audit

router = APIRouter(tags=["users"])


class StaffCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str = "staff"


class StaffUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    role: str | None = None
    status: str | None = None


@router.get("/users/me")
def get_current_user(user=Depends(current_user)):
    return public_document(user)


@router.get("/users")
def list_users(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
               database=Depends(get_db), user=Depends(require_roles("admin"))):
    total = database.users.count_documents({})
    records = database.users.find({}, {"password_hash": 0}).skip((page - 1) * page_size).limit(page_size)
    return {"items": [public_document(item) for item in records],
            "meta": {"page": page, "page_size": page_size, "total": total}}


@router.get("/staff")
def list_staff(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
               database=Depends(get_db), user=Depends(require_roles("admin"))):
    query = {"role": {"$in": ["admin", "staff"]}}
    total = database.users.count_documents(query)
    records = database.users.find(query, {"password_hash": 0}).skip((page - 1) * page_size).limit(page_size)
    return {"items": [public_document(item) for item in records],
            "meta": {"page": page, "page_size": page_size, "total": total}}


@router.post("/staff", status_code=status.HTTP_201_CREATED)
def create_staff(payload: StaffCreate, database=Depends(get_db), user=Depends(require_roles("admin"))):
    if payload.role not in {"staff", "admin"}:
        raise HTTPException(422, "Staff role must be staff or admin.")
    email = str(payload.email).lower()
    if database.users.find_one({"email": email}):
        raise HTTPException(409, "Email already registered.")
    record = {"id": uuid4().hex, "name": payload.name.strip(), "email": email,
              "role": payload.role, "status": "active", "password_hash": hash_password(payload.password),
              "created_at": datetime.now(timezone.utc).isoformat()}
    try:
        database.users.insert_one(record)
    except DuplicateKeyError as exc:
        raise HTTPException(409, "Email already registered.") from exc
    audit(database, user, "create", "staff", record["id"])
    return public_document(record)


@router.put("/staff/{staff_id}")
def update_staff(staff_id: str, payload: StaffUpdate, database=Depends(get_db),
                 user=Depends(require_roles("admin"))):
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(422, "At least one field is required.")
    if "role" in changes and changes["role"] not in {"staff", "admin"}:
        raise HTTPException(422, "Staff role must be staff or admin.")
    if "status" in changes and changes["status"] not in {"active", "inactive"}:
        raise HTTPException(422, "Status must be active or inactive.")
    changes["updated_at"] = datetime.now(timezone.utc).isoformat()
    record = database.users.find_one_and_update({"id": staff_id, "role": {"$in": ["staff", "admin"]}},
                                                 {"$set": changes}, return_document=True)
    if not record:
        raise HTTPException(404, "Staff member not found.")
    audit(database, user, "update", "staff", staff_id)
    return public_document(record)


@router.delete("/staff/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def disable_staff(staff_id: str, database=Depends(get_db), user=Depends(require_roles("admin"))):
    result = database.users.update_one({"id": staff_id, "role": {"$in": ["staff", "admin"]}},
                                      {"$set": {"status": "inactive"}})
    if not result.matched_count:
        raise HTTPException(404, "Staff member not found.")
    audit(database, user, "disable", "staff", staff_id)
    return None
