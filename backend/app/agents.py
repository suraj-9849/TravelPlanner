import json

from langchain.agents import create_agent
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda
from langchain_groq import ChatGroq
from json_repair import repair_json
from pydantic import ValidationError

from app.config import get_settings
from app.middleware import observe_tool_call
from app.schemas import TripPlan
from app.tools.guides import find_top_guides
from app.tools.search import discover_nearby_places
from app.tools.weather import get_weather


def _model() -> ChatGroq:
    settings = get_settings()
    return ChatGroq(
        model="openai/gpt-oss-120b",
        groq_api_key=settings.groq_api_key,
        temperature=0,
        max_tokens=1800,
    )


def _agent(instructions: str, tools: list | None = None):
    return create_agent(
        model=_model(),
        tools=tools,
        middleware=[observe_tool_call],
        system_prompt=instructions,
    )


weather_agent = _agent(
    "You are the weather specialist. Check the requested destination and date with the weather tool. "
    "If it is unsuitable, use the traveler's current location to find a nearby alternative only when provided.",
    [get_weather],
)
discovery_agent = _agent(
    "You are the local discovery specialist. Use Tavily for current popularity/context and Google Maps for "
    "ratings and coordinates. Keep attractions and food stops near the selected base location.",
    [discover_nearby_places],
)
guide_agent = _agent(
    "You are the guide specialist. Query PostgreSQL for the top three guides matching the destination and "
    "return transparent contact, price, language, and rating details.",
    [find_top_guides],
)

_planning_prompt = PromptTemplate.from_template(
    "Create a practical {days}-day itinerary for {location} beginning {start_date}. "
    "Use only the supplied weather, discovery, and guide evidence. Keep every stop near {location}. "
    "Mention weather caveats, Google Maps ratings, food preferences {food_preferences}, and guide options. "
    "Return compact valid JSON with keys: destination, weather, attractions, food_stops, daily_plan, guides, warnings. "
    "Use short strings only, at most 2 attractions and 1 food stop per day, and at most 3 itinerary items per day. "
    "Do not include review counts, long descriptions, or narrative outside the JSON.\n\n"
    "Evidence:\n{evidence}"
)
_to_messages = RunnableLambda(lambda value: [
    SystemMessage(content="You are the final travel planner. Do not invent facts or silently change locations."),
    HumanMessage(content=value),
])


def _last_content(result: dict) -> str:
    messages = result.get("messages", [])
    for message in reversed(messages):
        if isinstance(message, (AIMessage, ToolMessage)) and message.content:
            return str(message.content)
    return "No specialist response returned."


def _parse_plan(content: str) -> dict:
    """Strip optional Markdown fences and validate the final response with Pydantic."""
    candidate = content.strip()
    if candidate.startswith("```"):
        candidate = candidate.split("\n", 1)[1] if "\n" in candidate else candidate
        candidate = candidate.rsplit("```", 1)[0].strip()
    try:
        return TripPlan.model_validate_json(candidate).model_dump(mode="json")
    except (ValidationError, ValueError):
        try:
            repaired = repair_json(candidate)
            return TripPlan.model_validate_json(repaired).model_dump(mode="json")
        except (ValidationError, ValueError):
            pass
        return TripPlan(warnings=["The planner returned non-JSON output.", candidate]).model_dump(mode="json")


def run_trip_planner(request: dict) -> dict:
    """Run specialist agents, then a constrained synthesis agent for one trip request."""
    common = json.dumps(request, default=str)
    weather = weather_agent.invoke({"messages": [HumanMessage(content=f"Trip request: {common}")]})
    discovery = discovery_agent.invoke({"messages": [HumanMessage(content=f"Trip request: {common}. Find attractions and food stops.")]})
    guides = guide_agent.invoke({"messages": [HumanMessage(content=f"Find guides for this trip request: {common}")]})
    evidence = json.dumps({
        "weather": _last_content(weather)[:1800],
        "discovery": _last_content(discovery)[:2800],
        "guides": _last_content(guides)[:1800],
    })
    prompt = _planning_prompt.format(**request, evidence=evidence)
    planning_messages = _to_messages.invoke(prompt)
    final = _model().invoke(planning_messages)
    plan = _parse_plan(str(final.content))
    return {"request": request, "plan": plan}
