# January 2026 data notes

## Source and coverage

The committed snapshot contains 1,488 FUELHH wind actuals (48 settlement periods for each of 31 delivery dates) and 15,775 WINDFOR forecasts. Actual target times cover 2 January through 1 February 2026. Forecast publication times cover 30 December 2025 through 1 February 2026. The raw API field names and UTC timestamp examples are in `docs/samples/`; the stream records use `startTime`, `publishTime`, and `generation`. WINDFOR has eight distinct publication times per day in this sample, and forecast lead times range from 0.5 to 66.5 hours.

Day-ahead decisions made 1–31 January 2026 correspond to delivery days 2 January–1 February. The decision cutoff is 09:00 Europe/London on D-1. Accuracy uses the latest forecast published at least the requested horizon before each target.

## 24-hour accuracy findings

For 744 hourly target points at a 24-hour minimum horizon, MAE is 1,932 MW, RMSE is 2,399 MW, WAPE is 17.1%, and mean bias is +1,736 MW. The P90 absolute error is 3,850 MW. A positive bias means this sample's forecast tends to over-predict wind, which can leave a trader under-bought if they procure against the forecast without a buffer. Error increases across the forecast horizon: MAE rises from 1,680 MW at 0 h to 2,301 MW at 48 h, and is 2,183 MW at 39 h. The largest daily MAE is 5,020 MW on 11 January.

Treat these as descriptive pilot findings, not a production risk guarantee. In particular, the uncertainty band and reported monthly metrics are in-sample. The data show sizable variation by time of day, with the largest hourly MAE around 05:00 (2,381 MW) and lowest around 16:00 (1,543 MW).

## Interpretation limits

WINDFOR targets are hourly while FUELHH values are half-hourly. The exact timestamp join intentionally retains only shared hourly targets. Production should estimate uncertainty from a trailing window that ends before each decision and should revalidate the assumed market cutoff with the trading team.
