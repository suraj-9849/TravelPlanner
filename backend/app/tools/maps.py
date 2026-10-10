import requests
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from app.config import get_settings


class NearbyPlacesInput(BaseModel):
    location: str = Field(description="Base destination or address")
    place_type: str = Field(default="tourist_attraction", description="Google Places type")
    radius_meters: int = Field(default=10000, ge=100, le=50000)


@tool(args_schema=NearbyPlacesInput)
def find_nearby_places(
    location: str, place_type: str = "tourist_attraction", radius_meters: int = 10000
) -> list[dict]:
    """Find nearby Google Maps places with ratings, addresses, coordinates, and Maps links.

    place_type can be tourist_attraction, restaurant, cafe, museum, or another
    Google Places type. Use the selected destination as the location so results
    stay geographically near the trip base.
    """
    settings = get_settings()
    geocode = requests.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        params={"address": location, "key": settings.google_maps_api_key},
        timeout=15,
    )
    geocode.raise_for_status()
    results = geocode.json().get("results", [])
    if not results:
        return []
    point = results[0]["geometry"]["location"]
    places = requests.get(
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
        params={
            "location": f"{point['lat']},{point['lng']}",
            "radius": radius_meters,
            "type": place_type,
            "key": settings.google_maps_api_key,
        },
        timeout=15,
    )
    places.raise_for_status()
    return [
        {
            "name": item.get("name"),
            "address": item.get("vicinity"),
            "rating": item.get("rating"),
            "user_ratings_total": item.get("user_ratings_total"),
            "place_id": item.get("place_id"),
            "maps_url": f"https://www.google.com/maps/search/?api=1&query=Google&query_place_id={item.get('place_id')}",
        }
        for item in places.json().get("results", [])
    ]
