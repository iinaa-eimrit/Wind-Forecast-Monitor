from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_bad_horizon():
    assert client.get("/api/accuracy?horizon_h=99").status_code == 422
