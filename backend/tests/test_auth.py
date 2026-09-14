from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
import pytest


REGISTER = {
    "name": "Test Gardener",
    "email": "gardener@example.com",
    "password": "correct-horse-battery-staple",
}


def register(client):
    return client.post("/auth/register", json=REGISTER)


def test_register_hashes_password_and_hides_sensitive_fields(client):
    response = register(client)
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == REGISTER["email"]
    assert "password" not in str(body).lower()
    assert "access_token" not in body
    assert "httponly" in response.headers["set-cookie"].lower()

    from database.connection import SessionLocal
    from database.models.user import User
    from utils.auth_helpers import verify_password
    user = SessionLocal().query(User).filter_by(email=REGISTER["email"]).one()
    assert user.password_hash != REGISTER["password"]
    assert verify_password(REGISTER["password"], user.password_hash)


def test_duplicate_registration_is_rejected(client):
    assert register(client).status_code == 201
    assert register(client).status_code == 400


def test_login_and_me_use_cookie_session(client):
    assert register(client).status_code == 201
    client.post("/auth/logout")
    response = client.post("/auth/login", json={"email": REGISTER["email"], "password": REGISTER["password"]})
    assert response.status_code == 200
    assert "access_token" not in response.json()
    me = client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == REGISTER["email"]
    assert "password_hash" not in me.json()


def test_invalid_credentials_and_missing_session_are_rejected(client):
    assert register(client).status_code == 201
    client.post("/auth/logout")
    assert client.get("/auth/me").status_code == 401
    assert client.post("/auth/login", json={"email": REGISTER["email"], "password": "wrong-password"}).status_code == 401
    client.cookies.set("access_token", "not-a-valid-jwt")
    assert client.get("/auth/me").status_code == 401


def test_expired_jwt_is_rejected(client):
    expired = jwt.encode(
        {"sub": "00000000-0000-0000-0000-000000000000", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        "test-only-signing-secret-with-at-least-32-characters",
        algorithm="HS256",
    )
    client.cookies.set("access_token", expired)
    assert client.get("/auth/me").status_code == 401


def test_logout_clears_cookie(client):
    assert register(client).status_code == 201
    response = client.post("/auth/logout")
    assert response.status_code == 200
    assert "max-age=0" in response.headers["set-cookie"].lower()
    assert client.get("/auth/me").status_code == 401


def test_jwt_secret_is_required_and_not_hardcoded(monkeypatch):
    from config import get_settings
    monkeypatch.delenv("JWT_SECRET_KEY")
    with pytest.raises(RuntimeError, match="JWT_SECRET_KEY"):
        get_settings()
    source = (Path(__file__).resolve().parents[1] / "utils" / "auth_helpers.py").read_text()
    assert "default_secret" not in source


def test_existing_endpoints_remain_available(client, tmp_path, monkeypatch):
    import services.history_service as history_module
    monkeypatch.setattr(history_module, "HISTORY_FILE", tmp_path / "history.json")

    assert client.get("/").status_code == 200
    assert client.get("/health").status_code == 200
    assert client.get("/health/db").status_code == 200
    assert client.get("/history").status_code == 200
    predict = client.post("/predict", json={"plants": [{
        "name": "Snake Plant", "water": "Properly watered", "sunlight": "Partial shade",
        "color": "Healthy green", "soil": "Moist",
    }]})
    assert predict.status_code == 200
    chat = client.post("/chat", json={"message": "How often should I water a snake plant?"})
    assert chat.status_code == 200
    assert "reply" in chat.json()
