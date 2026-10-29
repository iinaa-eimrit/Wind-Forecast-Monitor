from datetime import date, time
import pandas as pd
from app import analytics as a


def ts(value: str) -> pd.Timestamp:
    return pd.Timestamp(value, tz="UTC")


def toy_fc() -> pd.DataFrame:
    target = ts("2026-01-10 12:00")
    return pd.DataFrame({"start_time": [target] * 3,
        "publish_time": [target - pd.Timedelta(hours=h) for h in (30, 10, 1)],
        "forecast": [1000.0, 1200.0, 1300.0]})


def test_horizon_picks_latest_eligible():
    assert a.forecast_at_horizon(toy_fc(), 0).forecast.item() == 1300
    assert a.forecast_at_horizon(toy_fc(), 4).forecast.item() == 1200
    assert a.forecast_at_horizon(toy_fc(), 24).forecast.item() == 1000


def test_cutoff_and_bst():
    assert a.forecast_at_cutoff(toy_fc(), date(2026, 1, 10), time(9)).forecast.item() == 1000
    assert a.decision_cutoff_utc(date(2026, 7, 2), time(9)) == ts("2026-07-01 08:00")


def test_metrics_known_values():
    df = pd.DataFrame({"forecast": [110., 90.], "actual": [100., 100.]})
    df["error"] = df.forecast - df.actual
    m = a.metrics(df.assign(start_time=[ts("2026-01-01"), ts("2026-01-01 01:00")]))
    assert m["mae"] == 10 and m["bias"] == 0 and m["rmse"] == 10 and m["wape_pct"] == 10
