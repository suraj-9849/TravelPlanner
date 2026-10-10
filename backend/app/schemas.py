from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class TripRequest(BaseModel):
    location: str = Field(min_length=2, description="Destination city or address")
    start_date: date
    days: int = Field(default=3, ge=1, le=30)
    traveler_location: str | None = Field(default=None, description="Current city used for nearby alternatives")
    food_preferences: list[str] = Field(default_factory=list)
    needs_guide: bool = False


class GuideBookingRequest(BaseModel):
    traveler_name: str = Field(min_length=2)
    start_date: date
    days: int = Field(ge=1, le=30)


class TripPlan(BaseModel):
    """Validated shape returned by the final itinerary agent."""

    model_config = ConfigDict(extra="allow")

    destination: str = ""
    weather: dict[str, Any] | str = Field(default_factory=dict)
    attractions: list[Any] | dict[str, Any] = Field(default_factory=list)
    food_stops: list[Any] | dict[str, Any] = Field(default_factory=list)
    daily_plan: list[dict[str, Any]] | dict[str, Any] = Field(default_factory=list)
    guides: list[dict[str, Any]] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)

