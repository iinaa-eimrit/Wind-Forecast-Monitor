dev-api:
	cd backend && uvicorn app.main:app --reload

dev-web:
	cd frontend && npm run dev

test:
	cd backend && python -m pytest -q

refresh-data:
	cd backend && python -m ingest.elexon

docker:
	docker compose up --build
