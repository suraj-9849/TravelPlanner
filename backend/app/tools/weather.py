import requests
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from app.config import get_settings


class WeatherInput(BaseModel):
    location: str = Field(description="Destination city or address")
    target_date: str = Field(description="Date to check in YYYY-MM-DD format")


@tool(args_schema=WeatherInput)
def get_weather(location: str, target_date: str) -> dict:
    """Fetch the forecast for a destination and date from OpenWeatherMap.

    Use this before judging whether a trip is suitable. The result includes the
    resolved city, forecast summary, temperature, precipitation probability, and
    a compact recommendation signal. target_date must be YYYY-MM-DD.
    """
    settings = get_settings()
    response = requests.get(
        "https://api.openweathermap.org/data/2.5/forecast",
        params={"q": location, "appid": settings.openweather_api_key, "units": "metric"},
        timeout=15,
    )
    response.raise_for_status()
    data = response.json()
    forecasts = [item for item in data.get("list", []) if item["dt_txt"].startswith(target_date)]
    if not forecasts:
        return {"location": location, "date": target_date, "status": "forecast_unavailable"}
    rain = max(float(item.get("pop", 0)) for item in forecasts)
    temperatures = [float(item["main"]["temp"]) for item in forecasts]
    descriptions = sorted({item["weather"][0]["description"] for item in forecasts})
    return {
        "location": data.get("city", {}).get("name", location),
        "date": target_date,
        "temperature_c": {"min": min(temperatures), "max": max(temperatures)},
        "descriptions": descriptions,
        "precipitation_probability": rain,
        "is_suitable": rain < 0.65 and max(temperatures) < 42,
    }
