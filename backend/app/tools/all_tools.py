from app.tools.guides import find_top_guides
from app.tools.maps import find_nearby_places
from app.tools.search import discover_nearby_places, search_local_places
from app.tools.weather import get_weather

TRAVEL_TOOLS = [get_weather, search_local_places, discover_nearby_places, find_nearby_places, find_top_guides]
