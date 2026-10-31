from fastapi import APIRouter, HTTPException, status
from jose import JWTError

from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.schemas.auth import LoginRequest, PasswordResetRequest, RefreshTokenRequest, RegisterRequest, TokenPair, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

users_db: dict[str, dict] = {}


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserOut)
def register(payload: RegisterRequest):
    if payload.email.lower() in users_db:
        raise HTTPException(status_code=409, detail="Email already registered.")
    user = {
        "id": f"user_{len(users_db) + 1}",
        "name": payload.name,
        "email": payload.email.lower(),
        "role": payload.role,
        "password_hash": hash_password(payload.password),
    }
    users_db[user["email"]] = user
    return UserOut(**{k: user[k] for k in ["id", "name", "email", "role"]})


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest):
    user = users_db.get(payload.email.lower())
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return TokenPair(
        access_token=create_access_token(user["email"]),
        refresh_token=create_refresh_token(user["email"]),
    )


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshTokenRequest):
    try:
        claims = decode_token(payload.refresh_token)
    except HTTPException as exc:
        raise exc
    email = claims.get("sub")
    if not email or email not in users_db:
        raise HTTPException(status_code=401, detail="Refresh token is invalid.")
    return TokenPair(
        access_token=create_access_token(email),
        refresh_token=create_refresh_token(email),
    )


@router.post("/forgot-password")
def forgot_password(payload: PasswordResetRequest):
    if payload.email.lower() not in users_db:
        return {"message": "If the email exists, a reset link has been sent."}
    return {"message": "Password reset link generated for demo environment."}


@router.post("/reset-password")
def reset_password():
    return {"message": "Password reset complete."}


def get_user_by_email(email: str):
    return users_db.get(email.lower())
