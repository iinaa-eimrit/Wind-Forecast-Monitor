from __future__ import annotations

from datetime import date, datetime, time, timedelta

import numpy as np
import pandas as pd

from .config import MARKET_TZ


def forecast_at_horizon(fc: pd.DataFrame, horizon_h: float, max_lead_h: float = 72) -> pd.DataFrame:
    lead = (fc["start_time"] - fc["publish_time"]).dt.total_seconds() / 3600
    eligible = fc.loc[(lead >= horizon_h) & (lead <= max_lead_h)].copy()
    if eligible.empty:
        return eligible.assign(lead_h=pd.Series(dtype=float))
    out = eligible.loc[eligible.groupby("start_time")["publish_time"].idxmax()].copy()
    out["lead_h"] = (out["start_time"] - out["publish_time"]).dt.total_seconds() / 3600
    return out.sort_values("start_time").reset_index(drop=True)


def decision_cutoff_utc(delivery_day: date, cutoff_local: time) -> pd.Timestamp:
    local = pd.Timestamp(datetime.combine(delivery_day - timedelta(days=1), cutoff_local)).tz_localize(MARKET_TZ)
    return local.tz_convert("UTC")


def delivery_day_bounds_utc(delivery_day: date) -> tuple[pd.Timestamp, pd.Timestamp]:
    start = pd.Timestamp(delivery_day).tz_localize(MARKET_TZ)
    end = pd.Timestamp(delivery_day + timedelta(days=1)).tz_localize(MARKET_TZ)
    return start.tz_convert("UTC"), end.tz_convert("UTC")


def forecast_at_cutoff(fc: pd.DataFrame, delivery_day: date, cutoff_local: time) -> pd.DataFrame:
    cutoff = decision_cutoff_utc(delivery_day, cutoff_local)
    start, end = delivery_day_bounds_utc(delivery_day)
    eligible = fc[(fc["publish_time"] <= cutoff) & (fc["start_time"] >= start) & (fc["start_time"] < end)]
    if eligible.empty:
        return eligible.assign(lead_h=pd.Series(dtype=float))
    out = eligible.loc[eligible.groupby("start_time")["publish_time"].idxmax()].copy()
    out["lead_h"] = (out["start_time"] - out["publish_time"]).dt.total_seconds() / 3600
    return out.sort_values("start_time").reset_index(drop=True)


def join_actuals(selected: pd.DataFrame, actuals: pd.DataFrame) -> pd.DataFrame:
    df = selected.merge(actuals, on="start_time", how="inner")
    df["error"] = df["forecast"] - df["actual"]
    return df


def metrics(df: pd.DataFrame) -> dict[str, float | int | None]:
    if df.empty:
        return {"n": 0, "mae": None, "rmse": None, "bias": None, "wape_pct": None,
                "p50_abs": None, "p90_abs": None, "p99_abs": None, "max_abs": None,
                "err_p10": None, "err_p90": None, "corr": None, "mean_actual": None}
    err = df["error"].to_numpy(dtype=float)
    abs_err = np.abs(err)
    actual_sum = float(df["actual"].sum())
    corr = float(np.corrcoef(df["forecast"], df["actual"])[0, 1]) if len(df) > 2 else None
    if corr is not None and not np.isfinite(corr):
        corr = None
    return {"n": int(len(df)), "mae": float(abs_err.mean()), "rmse": float(np.sqrt(np.mean(err ** 2))),
            "bias": float(err.mean()), "wape_pct": float(abs_err.sum() / actual_sum * 100) if actual_sum > 0 else None,
            "p50_abs": float(np.percentile(abs_err, 50)), "p90_abs": float(np.percentile(abs_err, 90)),
            "p99_abs": float(np.percentile(abs_err, 99)), "max_abs": float(abs_err.max()),
            "err_p10": float(np.percentile(err, 10)), "err_p90": float(np.percentile(err, 90)),
            "corr": corr, "mean_actual": float(df["actual"].mean())}


def error_by_horizon(fc: pd.DataFrame, actuals: pd.DataFrame, horizons=range(0, 49, 3)) -> list[dict]:
    return [{"horizon_h": h, **metrics(join_actuals(forecast_at_horizon(fc, h), actuals))} for h in horizons]


def error_by_hour_of_day(df: pd.DataFrame) -> list[dict]:
    hours = df["start_time"].dt.tz_convert(MARKET_TZ).dt.hour
    grouped = df.assign(hour=hours, abs_err=df["error"].abs()).groupby("hour")
    return [{"hour": int(hour), "mae": float(row["abs_err"].mean()), "bias": float(row["error"].mean()), "n": int(len(row))}
            for hour, row in grouped]


def error_histogram(df: pd.DataFrame, bins: int = 30) -> list[dict]:
    if df.empty:
        return []
    counts, edges = np.histogram(df["error"], bins=bins)
    return [{"from": float(edges[i]), "to": float(edges[i + 1]), "count": int(count)} for i, count in enumerate(counts)]


def uncertainty_band(fc: pd.DataFrame, actuals: pd.DataFrame, lead_h: pd.Series, bucket_h: int = 6) -> pd.DataFrame:
    hist = []
    for h in range(0, 49, bucket_h):
        joined = join_actuals(forecast_at_horizon(fc, h, max_lead_h=h + bucket_h), actuals)
        if len(joined) > 20:
            hist.append({"bucket": h, "p10": np.percentile(joined["error"], 10), "p90": np.percentile(joined["error"], 90)})
    if not hist:
        return pd.DataFrame({"p10": np.zeros(len(lead_h)), "p90": np.zeros(len(lead_h))})
    table = pd.DataFrame(hist).set_index("bucket")
    bucket = (lead_h // bucket_h * bucket_h).clip(upper=table.index.max()).astype(int)
    return table.reindex(bucket).reset_index(drop=True)
