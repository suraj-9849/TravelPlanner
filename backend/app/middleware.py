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
        return handler(request)
    except Exception as exc:
        logger.exception("travelplanner tool failed: %s", tool_name)
        return ToolMessage(
            content=f"Tool {tool_name} failed safely: {exc}",
            tool_call_id=request.tool_call["id"],
        )
