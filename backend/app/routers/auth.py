from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.dependencies import current_user, get_db, public_document
from app.core.security import (create_access_token, create_refresh_token, decode_token,
                               hash_password, verify_password)
from app.schemas.auth import (LoginRequest, PasswordResetRequest, RefreshTokenRequest,
                              RegisterRequest, TokenPair, UserOut)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserOut)
def register(payload: RegisterRequest, database=Depends(get_db)):
    email = str(payload.email).lower()
    if database.users.find_one({"email": email}):
        raise HTTPException(409, "Email already registered.")
    user = {"id": uuid4().hex, "name": payload.name.strip(), "email": email,
            "role": "customer", "status": "active",
            "password_hash": hash_password(payload.password),
            "created_at": datetime.now(timezone.utc).isoformat()}
    try:
        database.users.insert_one(user)
    except DuplicateKeyError as exc:
        raise HTTPException(409, "Email already registered.") from exc
    return public_document(user)


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, database=Depends(get_db)):
    user = database.users.find_one({"email": str(payload.email).lower()})
    if not user or user.get("status", "active") != "active" or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password.")
    return TokenPair(access_token=create_access_token(user["email"]),
                     refresh_token=create_refresh_token(user["email"]))


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshTokenRequest, database=Depends(get_db)):
    claims = decode_token(payload.refresh_token)
    email = claims.get("sub")
    if claims.get("type") != "refresh" or not email:
        raise HTTPException(401, "Refresh token is invalid.")
    user = database.users.find_one({"email": email.lower(), "status": "active"})
    if not user:
        raise HTTPException(401, "Refresh token is invalid.")
    return TokenPair(access_token=create_access_token(email),
                     refresh_token=create_refresh_token(email))


@router.post("/forgot-password")
def forgot_password(payload: PasswordResetRequest, database=Depends(get_db)):
    # No delivery/reset-token workflow is configured; avoid claiming an email was sent.
    database.users.find_one({"email": str(payload.email).lower()}, {"_id": 1})
    return {"message": "Password reset is not configured. Contact an administrator."}


@router.post("/reset-password")
def reset_password():
    raise HTTPException(status_code=501, detail="Password reset is not configured.")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    """Stateless JWT logout: clients discard tokens; no server revocation is configured."""
    return None


@router.get("/me", response_model=UserOut)
def me(user=Depends(current_user)):
    return public_document(user)
