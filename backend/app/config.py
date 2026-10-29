from datetime import time
import os
from pathlib import Path

DATA_DIR = Path(os.getenv("DATA_DIR", Path(__file__).resolve().parents[1] / "data"))
MARKET_TZ = "Europe/London"
DEFAULT_CUTOFF = time(9, 0)
MAX_HORIZON_H = 48
