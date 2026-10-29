"""Download and validate the January 2026 GB wind data snapshot from Elexon BMRS."""
from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import httpx
import pandas as pd

BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SAMPLES_DIR = Path(__file__).resolve().parents[2] / "docs" / "samples"


def request_json(url: str, params: dict[str, str]) -> list[dict]:
    for attempt in range(4):
        try:
            response = httpx.get(url, params=params, timeout=45)
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, list):
                raise ValueError(f"Expected a JSON array from {response.url}")
            return payload
        except (httpx.HTTPError, ValueError):
            if attempt == 4:
                raise
            time.sleep(2 ** attempt)
    return []


def fetch_actuals() -> pd.DataFrame:
    rows: list[dict] = []
    # Daily chunks avoid oversized responses and make retries inexpensive.
    days = list(pd.date_range("2026-01-02", "2026-02-01", freq="D"))
    def fetch_day(day: pd.Timestamp) -> list[dict]:
        ds = day.strftime("%Y-%m-%d")
        return request_json(f"{BASE}/FUELHH/stream", {
            "settlementDateFrom": ds, "settlementDateTo": ds, "fuelType": "WIND"})
    with ThreadPoolExecutor(max_workers=8) as pool:
        for batch in pool.map(fetch_day, days):
            rows.extend(batch)
    df = pd.DataFrame(rows)
    if df.empty:
        raise ValueError("Elexon returned no FUELHH rows")
    df = df.rename(columns={"startTime": "start_time", "generation": "actual"})
    df["start_time"] = pd.to_datetime(df["start_time"], utc=True)
    df["actual"] = pd.to_numeric(df["actual"], errors="coerce")
    return df[["start_time", "actual"]].dropna().drop_duplicates("start_time").sort_values("start_time").reset_index(drop=True)


def fetch_forecasts() -> pd.DataFrame:
    rows: list[dict] = []
    # Publish window covers earlier leads through the last January bidding day.
    days = list(pd.date_range("2025-12-30", "2026-02-01", freq="D"))
    def fetch_day(day: pd.Timestamp) -> list[dict]:
        start = day.strftime("%Y-%m-%dT00:00:00Z")
        end = (day + pd.Timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z")
        return request_json(f"{BASE}/WINDFOR/stream", {"publishDateTimeFrom": start, "publishDateTimeTo": end})
    with ThreadPoolExecutor(max_workers=8) as pool:
        for batch in pool.map(fetch_day, days):
            rows.extend(batch)
    df = pd.DataFrame(rows)
    if df.empty:
        raise ValueError("Elexon returned no WINDFOR rows")
    df = df.rename(columns={"startTime": "start_time", "publishTime": "publish_time", "generation": "forecast"})
    df["start_time"] = pd.to_datetime(df["start_time"], utc=True)
    df["publish_time"] = pd.to_datetime(df["publish_time"], utc=True)
    df["forecast"] = pd.to_numeric(df["forecast"], errors="coerce")
    df = df[["start_time", "publish_time", "forecast"]].dropna().drop_duplicates(["start_time", "publish_time"])
    df = df[df["publish_time"] <= df["start_time"]].sort_values(["start_time", "publish_time"]).reset_index(drop=True)
    return df


def validate(actuals: pd.DataFrame, forecasts: pd.DataFrame) -> None:
    if actuals.empty or forecasts.empty:
        raise ValueError("Snapshot tables must not be empty")
    if actuals["start_time"].duplicated().any():
        raise ValueError("Actual target times must be unique")
    if forecasts.duplicated(["start_time", "publish_time"]).any():
        raise ValueError("Forecast target/publish pairs must be unique")
    if (forecasts["publish_time"] > forecasts["start_time"]).any():
        raise ValueError("Forecast publish time cannot follow target time")


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    actuals, forecasts = fetch_actuals(), fetch_forecasts()
    validate(actuals, forecasts)
    actuals.to_csv(DATA_DIR / "actuals.csv.gz", index=False, compression="gzip")
    forecasts.to_csv(DATA_DIR / "forecasts.csv.gz", index=False, compression="gzip")
    # Preserve concise examples of the raw API schemas for reviewers.
    for name, url, params in [
        ("fuelhh_wind_sample.json", f"{BASE}/FUELHH/stream", {"settlementDateFrom": "2026-01-02", "settlementDateTo": "2026-01-02", "fuelType": "WIND"}),
        ("windfor_sample.json", f"{BASE}/WINDFOR/stream", {"publishDateTimeFrom": "2026-01-01T00:00:00Z", "publishDateTimeTo": "2026-01-02T00:00:00Z"}),
    ]:
        rows = request_json(url, params)
        (SAMPLES_DIR / name).write_text(pd.Series(rows[:5]).to_json(orient="values", date_format="iso", indent=2))
    print(f"Saved {len(actuals):,} actuals and {len(forecasts):,} forecasts")


if __name__ == "__main__":
    main()
