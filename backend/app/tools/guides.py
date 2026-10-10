from langchain_core.tools import tool
from pydantic import BaseModel, Field

from app.db import prisma, run_async


class GuideSearchInput(BaseModel):
    location: str = Field(description="Destination city to search")
    limit: int = Field(default=3, ge=1, le=10)


@tool(args_schema=GuideSearchInput)
def find_top_guides(location: str, limit: int = 3) -> list[dict]:
    """Return the highest-rated local guides near a destination from PostgreSQL.

    Results include guide id, name, service location, phone number, languages,
    specialties, daily price, and rating. Use this only for suggestions; booking
    is a separate explicit API action by the traveler.
    """
    rows = run_async(
        prisma.guide.find_many(
            where={"location": {"contains": location, "mode": "insensitive"}},
            order={"rating": "desc"},
            take=limit,
        )
    )
    return [
        {
            "id": g.id,
            "name": g.name,
            "location": g.location,
            "phone_number": g.phone_number,
            "languages": g.languages.split(","),
            "specialties": g.specialties,
            "price_per_day": g.price_per_day,
            "rating": g.rating,
        }
        for g in rows
    ]
