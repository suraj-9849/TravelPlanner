import logging

from langchain.agents.middleware import wrap_tool_call
from langchain_core.messages import ToolMessage

logger = logging.getLogger(__name__)


@wrap_tool_call
def observe_tool_call(request, handler):
    """Log every tool invocation and turn recoverable integration failures into ToolMessages."""

    tool_name = request.tool_call["name"]
    logger.info("travelplanner tool call: %s", tool_name)
    try:
        result = handler(request)
        # Groq rejects an empty array/null as the content of a role=tool
        # message. Empty search results are valid, so keep the result but
        # serialize that empty value to a non-empty tool response.
        if isinstance(result, ToolMessage) and result.content in (None, "", []):
            return result.model_copy(update={"content": "[]"})
        return result
    except Exception as exc:
        logger.exception("travelplanner tool failed: %s", tool_name)
        return ToolMessage(
            content=f"Tool {tool_name} failed safely: {exc}",
            tool_call_id=request.tool_call["id"],
        )
