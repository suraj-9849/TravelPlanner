import requests
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from app.config import get_settings
from app.tools.maps import find_nearby_places


class LocalSearchInput(BaseModel):
    query: str = Field(description="What to find, such as attractions or vegetarian restaurants")
    location: str = Field(description="Base destination; results must stay nearby")
    max_results: int = Field(default=5, ge=1, le=8)


class NearbyDiscoveryInput(BaseModel):
    location: str = Field(description="Base destination for nearby attractions and food")
    food_preferences: list[str] = Field(default_factory=list)


@tool(args_schema=LocalSearchInput)
def search_local_places(query: str, location: str, max_results: int = 8) -> list[dict]:
    """Search current, popular attractions or food stops near a location with Tavily.

    Use specific queries such as 'top attractions near Hyderabad' or 'vegetarian
    restaurants near Charminar'. Return source-backed names, descriptions, URLs,
    and snippets; never invent a venue when the search has no result.
    """
    settings = get_settings()
    response = requests.post(
        "https://api.tavily.com/search",
        json={
            "api_key": settings.tavily_api_key,
            "query": f"{query} near {location}",
            "search_depth": "advanced",
            "max_results": max_results,
            "include_answer": False,
        },
        timeout=20,
    )
    response.raise_for_status()
    return [
        {
            "title": item.get("title"),
            "url": item.get("url"),
            "snippet": (item.get("content") or item.get("snippet") or "")[:600],
        }
        for item in response.json().get("results", [])[:max_results]
    ]


@tool(args_schema=NearbyDiscoveryInput)
def discover_nearby_places(location: str, food_preferences: list[str] | None = None) -> dict:
    """Fetch source-backed popular attractions and nearby food stops with Tavily and Google Maps.

    This compact orchestration tool intentionally keeps both provider calls behind
    one model-visible schema to control prompt size while preserving both sources.
    """
    preferences = ", ".join(food_preferences or []) or "local specialties"
    attractions = search_local_places.invoke(
        {
            "query": "popular tourist attractions and things to do",
            "location": location,
            "max_results": 5,
        }
    )
    food_search = search_local_places.invoke(
        {
            "query": f"{preferences} restaurants and food stops",
            "location": location,
            "max_results": 5,
        }
    )
    mapped_attractions = find_nearby_places.invoke(
        {
            "location": location,
            "place_type": "tourist_attraction",
            "radius_meters": 10000,
        }
    )
    mapped_food = find_nearby_places.invoke(
        {
            "location": location,
            "place_type": "restaurant",
            "radius_meters": 10000,
        }
    )
    return {
        "tavily_attractions": attractions,
        "tavily_food": food_search,
        "google_maps_attractions": mapped_attractions[:5],
        "google_maps_food": mapped_food[:5],
    }
