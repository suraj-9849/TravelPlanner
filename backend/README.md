### Setup

```bash
cd backend
deactivate
cp .env.example .env
uv sync
uv run prisma generate
uv run prisma db push
uv run python seed_guides.py
uv run uvicorn app.main:app --reload
```

```bash
curl -X POST http://localhost:8000/api/trips/plan \
  -H 'Content-Type: application/json' \
  -d '{"location":"Hyderabad","start_date":"2026-11-10","days":3,"traveler_location":"Bengaluru","food_preferences":["vegetarian"],"needs_guide":true}'
```

For readable terminal output, pipe the response through Rich:

```bash
curl -s -X POST http://localhost:8000/api/trips/plan \
  -H 'Content-Type: application/json' \
  -d '{"location":"Hyderabad","start_date":"2026-11-10","days":3,"traveler_location":"Bengaluru","food_preferences":["vegetarian"],"needs_guide":true}' \
  | uv run python print_plan.py
```