from typing import Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_token
from app.db.mongodb import get_database as open_database

bearer = HTTPBearer(auto_error=False)


def get_db(request: Request):
    database = getattr(request.app.state, "db", None)
    return database if database is not None else open_database()


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    database=Depends(get_db),
):
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    claims = decode_token(credentials.credentials)
    if claims.get("type") == "refresh" or not claims.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid access token.")
    user = database.users.find_one({"email": claims["sub"].lower()})
    if not user or user.get("status", "active") != "active":
        raise HTTPException(status_code=401, detail="Invalid or inactive account.")
    # Keep the application-level UUID when present; Mongo's ObjectId is only a fallback.
    user["id"] = str(user.get("id") or user.get("_id", ""))
    return user


def require_roles(*roles: str) -> Callable:
    def dependency(user=Depends(current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions.")
        return user
    return dependency


def public_document(document):
    if not document:
        return document
    result = dict(document)
    result["id"] = str(result.pop("_id", result.get("id", "")))
    result.pop("password_hash", None)
    return result
