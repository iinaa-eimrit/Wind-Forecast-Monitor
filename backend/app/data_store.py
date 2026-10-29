from functools import lru_cache
import pandas as pd
from .config import DATA_DIR


@lru_cache(maxsize=1)
def load() -> tuple[pd.DataFrame, pd.DataFrame]:
    actuals = pd.read_csv(DATA_DIR / "actuals.csv.gz", parse_dates=["start_time"])
    forecasts = pd.read_csv(DATA_DIR / "forecasts.csv.gz", parse_dates=["start_time", "publish_time"])
    for frame, columns in ((actuals, ["start_time"]), (forecasts, ["start_time", "publish_time"])):
        for column in columns:
            frame[column] = pd.to_datetime(frame[column], utc=True)
    return actuals, forecasts
