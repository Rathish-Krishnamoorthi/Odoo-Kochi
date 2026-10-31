from fastapi import APIRouter

from app.routers.auth import users_db

router = APIRouter(tags=["users"])


@router.get("/users/me")
def get_current_user():
    return {"id": "user_1", "name": "System Admin", "role": "admin"}


@router.get("/users")
def list_users():
    return [
        {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}
        for user in users_db.values()
    ]


@router.get("/staff")
def list_staff():
    return [
        {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}
        for user in users_db.values()
        if user["role"] in {"admin", "staff"}
    ]
