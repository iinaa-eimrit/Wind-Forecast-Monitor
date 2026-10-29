# WindSight — GB Day-Ahead Wind Forecast Monitor (January 2026 pilot)

WindSight helps a UK utility's day-ahead trading team see the latest wind forecast available at bid cutoff and quantify how forecasts performed at realistic decision horizons. The pilot uses national Elexon BMRS wind actuals (FUELHH) and forecasts (WINDFOR).

## Run locally

```bash
docker compose up --build
# open http://localhost:8000
```

Without Docker, use Python 3.12 and Node 22:

```bash
cd backend && pip install -r requirements.txt
python -m ingest.elexon
uvicorn app.main:app --reload
```

In another terminal, run `cd frontend && npm install && npm run dev`. The Vite development server proxies `/api` to FastAPI. API docs are available at `/docs`. `make refresh-data` refreshes the historical snapshot, and `make test` runs the Python suite.

Run the project checks with `python -m ruff check backend`, `cd backend && python -m pytest -q`, and `cd frontend && npm run build`.

## Repository map

| Path | Purpose |
|---|---|
| `backend/ingest/elexon.py` | Fetches, validates, and saves compact FUELHH and WINDFOR snapshots |
| `backend/data/*.csv.gz` | Versioned historical input data |
| `backend/app/analytics.py` | Pure forecast selection, metrics, horizon analysis, and uncertainty band functions |
| `backend/app/main.py` | FastAPI routes for `/api/decision`, `/api/series`, `/api/accuracy`, `/api/meta`, and `/api/health` |
| `backend/tests/` | Analytics and API tests |
| `frontend/src/` | React + TypeScript Decision, Explorer, and Accuracy screens |
| `docs/samples/` | Raw Elexon API response examples |
| `Dockerfile`, `docker-compose.yml` | One-container local build serving the API and static frontend |

## Key decisions and limitations

- A decision for delivery day D uses the latest forecast published by D-1 at 09:20 Europe/London, the EPEX SPOT GB hourly day-ahead order-book closure. The cutoff is editable for portfolios trading a different auction; see the [EPEX SPOT trading brochure](https://www.epexspot.com/sites/default/files/2024-02/Trading%20brochure%202024.pdf).
- Accuracy at horizon h selects the latest forecast issued at least h hours before each target. This avoids flattering the forecast with information traders did not yet have.
- Forecasts are hourly and FUELHH actuals half-hourly; the accuracy join uses exact matching target timestamps, so metrics use the shared hourly points.
- WAPE is used instead of MAPE because near-zero wind can make MAPE misleading. The P90 error and dependable-wind figure are empirical estimates from this pilot month and are in-sample.
- This is a January 2026 historical pilot, national wind only, without demand, prices, or live updates. A production extension would schedule ingestion into a database and estimate uncertainty from a trailing window that ends before each decision.

## Deployment

The Docker image runs the combined app locally or on a container host. Vercel's deployment model is separate: it serves the built frontend statically and exposes FastAPI through a Python function. The Vercel configuration is ready, but the project has not been deployed yet because the browser is signed out of Vercel. Sign in at [Vercel](https://vercel.com/new), import `iinaa-eimrit/Wind-Forecast-Monitor` from GitHub, and deploy from the repository root. Add the live URL here after checking `/`, `/api/health`, and `/docs` on the deployed site.

## AI tools

AI assistance was used for project scaffolding, API boilerplate, typed UI components, and documentation drafting. Forecast selection, day-ahead cutoff behavior, and metric definitions follow the assignment workbook and should be reviewed against the included analytics code and tests.

## Submission

- Public repository: https://github.com/iinaa-eimrit/Wind-Forecast-Monitor
- Live app: pending Vercel deployment
- Unlisted demo video (client pitch + technical walkthrough, 10 minutes maximum): pending recording and upload
- Challenge submission form: submit the repository, live app, and video links after both are ready
