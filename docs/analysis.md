# January 2026 data notes

## Source and selection

The snapshot comes from Elexon BMRS datasets FUELHH (filtered to `fuelType=WIND`) and WINDFOR. Raw response examples are in `docs/samples/`. The ingestion script stores UTC-aware target and publication timestamps, removes duplicates, and excludes forecasts published after their target time.

Day-ahead decisions made 1–31 January 2026 correspond to delivery days 2 January–1 February. The decision cutoff is 09:00 Europe/London on D-1. Accuracy uses the latest forecast published at least the requested horizon before each target.

## Findings

Populate this section after refreshing the snapshot and reviewing `/api/accuracy` at a 24-hour horizon. Record MAE, RMSE, WAPE, bias, P90 absolute error, the worst day, and the hour-of-day pattern before recording the demo.

## Interpretation limits

WINDFOR targets are hourly while FUELHH values are half-hourly. The exact timestamp join intentionally retains only shared hourly targets. The uncertainty band is estimated in-sample from the same January pilot; production should use a trailing window ending before each decision.
