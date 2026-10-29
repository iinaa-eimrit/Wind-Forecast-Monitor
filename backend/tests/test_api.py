from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_bad_horizon():
    assert client.get("/api/accuracy?horizon_h=99").status_code == 422


def test_accuracy_uses_committed_january_snapshot():
    response = client.get("/api/accuracy?horizon_h=24&start=2026-01-02&end=2026-02-01")
    assert response.status_code == 200
    body = response.json()
    assert body["metrics"]["n"] == 744
    assert body["metrics"]["p50_abs"] is not None
    assert body["metrics"]["p90_abs"] is not None
    assert body["metrics"]["p99_abs"] is not None


def test_decision_day_returns_cutoff_forecast_and_uncertainty_band():
    response = client.get("/api/decision?delivery_date=2026-01-15")
    assert response.status_code == 200
    body = response.json()
    assert len(body["forecast"]) == 24
    assert len(body["actual"]) == 48
    assert all(row["low"] <= row["high"] for row in body["forecast"])
    assert body["cutoff_utc"] == "2026-01-14T09:20:00+00:00"


def test_series_returns_actual_and_horizon_selected_forecast():
    response = client.get("/api/series?start=2026-01-02&end=2026-01-03&horizon_h=24")
    assert response.status_code == 200
    body = response.json()
    assert body["actual"]
    assert body["forecast"]
    assert all(row["lead_h"] >= 24 for row in body["forecast"])


def test_meta_reports_confirmed_cutoff():
    response = client.get("/api/meta")
    assert response.status_code == 200
    assert response.json()["default_cutoff"] == "09:20"
