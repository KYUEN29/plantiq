"""Centralized, environment-backed application configuration."""

import os
from dataclasses import dataclass


def _as_bool(value: str) -> bool:
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _origins(value: str) -> tuple[str, ...]:
    return tuple(origin.strip().rstrip("/") for origin in value.split(",") if origin.strip())


@dataclass(frozen=True)
class Settings:
    environment: str
    jwt_secret_key: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    cors_origins: tuple[str, ...]
    auth_cookie_secure: bool
    auth_cookie_samesite: str


def get_settings() -> Settings:
    """Load settings and fail closed when the JWT signing secret is absent."""
    environment = os.getenv("APP_ENV", "development").strip().lower()
    jwt_secret_key = os.getenv("JWT_SECRET_KEY", "").strip()
    if len(jwt_secret_key) < 32:
        raise RuntimeError(
            "JWT_SECRET_KEY must be set to a strong value of at least 32 characters."
        )

    jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256").strip()
    if jwt_algorithm != "HS256":
        raise RuntimeError("JWT_ALGORITHM must be HS256.")

    try:
        access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    except ValueError as error:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be an integer.") from error
    if not 1 <= access_token_expire_minutes <= 43_200:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be between 1 and 43200.")

    default_origins = "https://plantiq.vercel.app" if environment == "production" else "http://localhost:5173"
    cors_origins = _origins(os.getenv("CORS_ORIGINS", default_origins))
    if not cors_origins:
        raise RuntimeError("CORS_ORIGINS must contain at least one allowed origin.")

    default_secure = "true" if environment == "production" else "false"
    auth_cookie_secure = _as_bool(os.getenv("AUTH_COOKIE_SECURE", default_secure))
    auth_cookie_samesite = os.getenv(
        "AUTH_COOKIE_SAMESITE", "none" if auth_cookie_secure else "lax"
    ).strip().lower()
    if auth_cookie_samesite not in {"lax", "strict", "none"}:
        raise RuntimeError("AUTH_COOKIE_SAMESITE must be lax, strict, or none.")
    if auth_cookie_samesite == "none" and not auth_cookie_secure:
        raise RuntimeError("AUTH_COOKIE_SAMESITE=none requires AUTH_COOKIE_SECURE=true.")

    return Settings(
        environment=environment,
        jwt_secret_key=jwt_secret_key,
        jwt_algorithm=jwt_algorithm,
        access_token_expire_minutes=access_token_expire_minutes,
        cors_origins=cors_origins,
        auth_cookie_secure=auth_cookie_secure,
        auth_cookie_samesite=auth_cookie_samesite,
    )
