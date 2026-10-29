import os
from datetime import time
from pathlib import Path

DATA_DIR = Path(os.getenv("DATA_DIR", Path(__file__).resolve().parents[1] / "data"))
MARKET_TZ = "Europe/London"
# EPEX SPOT GB 60-minute day-ahead order book closes at 09:20 UK time.
# The API and decision screen accept overrides for other auction arrangements.
DEFAULT_CUTOFF = time(9, 20)
MAX_HORIZON_H = 48
