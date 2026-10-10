from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import APIStatusError

from app.agents import run_trip_planner
from app.config import get_settings
from app.db import prisma, run_async
from app.schemas import GuideBookingRequest, TripRequest

app = FastAPI(title="TravelPlanner API", version="0.1.0")
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/trips/plan")
def plan_trip(request: TripRequest) -> dict:
    """Check weather, discover nearby places, build a multi-day plan, and suggest guides."""
    try:
        return run_trip_planner(request.model_dump(mode="json"))
    except APIStatusError as exc:
        raise HTTPException(status_code=502, detail=f"AI provider request failed: {exc}") from exc


@app.get("/api/guides")
def list_guides(location: str, limit: int = 3) -> list[dict]:
    """List top-rated seeded guides for a destination."""
    if not 1 <= limit <= 20:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 20")
    guides = run_async(
        prisma.guide.find_many(
            where={"location": {"contains": location, "mode": "insensitive"}},
            order={"rating": "desc"},
            take=limit,
        )
    )
    return [
        {
            "id": guide.id,
            "name": guide.name,
            "location": guide.location,
            "phone_number": guide.phone_number,
            "languages": guide.languages.split(","),
            "specialties": guide.specialties,
            "price_per_day": guide.price_per_day,
            "rating": guide.rating,
        }
        for guide in guides
    ]


@app.post("/api/guides/{guide_id}/book")
def book_guide(guide_id: int, request: GuideBookingRequest) -> dict:
    """Create an explicit guide booking request after the traveler selects a guide."""
    guide = run_async(prisma.guide.find_unique(where={"id": guide_id}))
    if guide is None:
        raise HTTPException(status_code=404, detail="Guide not found")
    booking = run_async(
        prisma.booking.create(
            data={
                "guide_id": guide.id,
                "traveler_name": request.traveler_name,
                "start_date": request.start_date.isoformat(),
                "days": request.days,
            }
        )
    )
    return {"booking_id": booking.id, "guide_id": guide.id, "status": booking.status}
