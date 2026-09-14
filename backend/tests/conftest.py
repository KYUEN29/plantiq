import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

# Set before importing application modules: configuration must never fall back to a secret.
os.environ["APP_ENV"] = "testing"
os.environ["JWT_SECRET_KEY"] = "test-only-signing-secret-with-at-least-32-characters"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"
os.environ["AUTH_COOKIE_SECURE"] = "false"
os.environ["AUTH_COOKIE_SAMESITE"] = "lax"


@pytest.fixture()
def client(tmp_path, monkeypatch):
    database_path = tmp_path / "plantiq-test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{database_path.as_posix()}")

    for name in list(sys.modules):
        if name == "main" or name.startswith(("database", "routes", "utils.auth_helpers")):
            sys.modules.pop(name, None)

    import main
    from database.base import Base
    from database.connection import engine
    import database.models  # noqa: F401 - registers all ORM models

    Base.metadata.create_all(bind=engine)
    with TestClient(main.app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
