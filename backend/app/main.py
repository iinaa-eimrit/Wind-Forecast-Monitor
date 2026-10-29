from __future__ import annotations

from datetime import date, time
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles

from . import analytics as a
from .config import DEFAULT_CUTOFF, MAX_HORIZON_H
from .data_store import load

app = FastAPI(title="WindSight API", version="1.0.0", description="GB wind forecast monitor for the January 2026 day-ahead pilot")


def _window(start: Optional[date], end: Optional[date]):
    actuals, forecasts = load()
    lo = actuals.start_time.min() if start is None else a.delivery_day_bounds_utc(start)[0]
    hi = actuals.start_time.max() + pd.Timedelta(minutes=30) if end is None else a.delivery_day_bounds_utc(end)[1]
    if lo >= hi:
        raise HTTPException(400, "start must be before end")
    return actuals[(actuals.start_time >= lo) & (actuals.start_time < hi)], forecasts[(forecasts.start_time >= lo) & (forecasts.start_time < hi)]


def _records(df, columns):
    out = df[columns].copy()
    for column in out.columns:
        if str(out[column].dtype).startswith("datetime"):
            out[column] = out[column].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    return out.round(1).to_dict(orient="records")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/meta")
def meta():
    actuals, forecasts = load()
    return {"actuals_from": actuals.start_time.min().isoformat(), "actuals_to": actuals.start_time.max().isoformat(),
            "forecast_publish_from": forecasts.publish_time.min().isoformat(), "forecast_publish_to": forecasts.publish_time.max().isoformat(),
            "default_cutoff": DEFAULT_CUTOFF.strftime("%H:%M"), "max_horizon_h": MAX_HORIZON_H,
            "decision_days": {"from": "2026-01-01", "to": "2026-01-31"}}


@app.get("/api/series")
def series(start: Optional[date] = None, end: Optional[date] = None,
           horizon_h: float = Query(24, ge=0, le=MAX_HORIZON_H)):
    actuals, forecasts = _window(start, end)
    selected = a.forecast_at_horizon(forecasts, horizon_h)
    return {"actual": _records(actuals, ["start_time", "actual"]),
            "forecast": _records(selected, ["start_time", "publish_time", "forecast", "lead_h"])}


@app.get("/api/decision")
def decision(delivery_date: date, cutoff: time = DEFAULT_CUTOFF):
    actuals, forecasts = load()
    selected = a.forecast_at_cutoff(forecasts, delivery_date, cutoff)
    if selected.empty:
        raise HTTPException(404, "No forecast published before the cutoff for that delivery day")
    band = a.uncertainty_band(forecasts, actuals, selected["lead_h"])
    selected = selected.assign(low=selected["forecast"] - band["p90"].to_numpy(), high=selected["forecast"] - band["p10"].to_numpy())
    joined = a.join_actuals(selected, actuals)
    lo, hi = a.delivery_day_bounds_utc(delivery_date)
    day_actuals = actuals[(actuals.start_time >= lo) & (actuals.start_time < hi)]
    return {"cutoff_utc": a.decision_cutoff_utc(delivery_date, cutoff).isoformat(),
            "forecast_publish_time": selected.publish_time.max().isoformat(),
            "forecast": _records(selected, ["start_time", "forecast", "low", "high", "lead_h"]),
            "actual": _records(day_actuals, ["start_time", "actual"]),
            "summary": {"forecast_energy_mwh": float(selected.forecast.sum()),
                        "dependable_energy_mwh_p90": float(selected.low.clip(lower=0).sum()),
                        "metrics_hindsight": a.metrics(joined)}}


@app.get("/api/accuracy")
def accuracy(start: Optional[date] = None, end: Optional[date] = None,
             horizon_h: float = Query(24, ge=0, le=MAX_HORIZON_H)):
    actuals, forecasts = _window(start, end)
    joined = a.join_actuals(a.forecast_at_horizon(forecasts, horizon_h), actuals)
    return {"horizon_h": horizon_h, "metrics": a.metrics(joined),
            "by_horizon": a.error_by_horizon(forecasts, actuals),
            "by_hour": a.error_by_hour_of_day(joined) if not joined.empty else [],
            "histogram": a.error_histogram(joined)}


STATIC = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if STATIC.exists():
    app.mount("/", StaticFiles(directory=STATIC, html=True), name="spa")
