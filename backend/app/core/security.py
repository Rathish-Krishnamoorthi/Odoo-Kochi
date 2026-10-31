import re
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain an uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain a lowercase letter.")
    if not re.search(r"[^A-Za-z0-9]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character.")


def hash_password(password: str) -> str:
    validate_password_strength(password)
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    expires = timedelta(minutes=expires_minutes if expires_minutes is not None else settings.access_token_expire_minutes)
    expire = datetime.now(timezone.utc) + expires
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str, expires_days: int | None = None) -> str:
    expires = timedelta(days=expires_days if expires_days is not None else settings.refresh_token_expire_days)
    expire = datetime.now(timezone.utc) + expires
    payload = {"sub": subject, "type": "refresh", "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except Exception as exc:  # pragma: no cover - defensive guard
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        ) from exc
