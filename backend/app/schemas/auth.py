from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: Literal["customer"] = "customer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
