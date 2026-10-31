from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Brightloop Subscription API"
    app_env: str = "development"
    mongodb_uri: str = "mongodb://localhost:27017/brightloop"
    jwt_secret_key: str = "dev-secret-key-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    initial_admin_email: str | None = None
    initial_admin_password: str | None = None

    @model_validator(mode="after")
    def validate_production_secret(self):
        if self.app_env.lower() == "production" and (
            self.jwt_secret_key == "dev-secret-key-change-me" or len(self.jwt_secret_key) < 32
        ):
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters in production.")
        return self

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
