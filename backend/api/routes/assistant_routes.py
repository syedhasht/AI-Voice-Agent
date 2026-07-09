"""
AI Assistant API Routes

Provides the enterprise NL → SQL → Insight API endpoint.

Endpoint:
    POST /api/assistant/query
    Request:  { "question": str }
    Response: { question, generated_sql, columns, rows, summary, chart, is_error }
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.ai_assistant.ai_assistant_service import process_question
from utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/assistant", tags=["ai-assistant"])


class AssistantQueryRequest(BaseModel):
    """Request body for the AI assistant query endpoint."""
    question: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Natural language business question",
        examples=["Which medicine has the highest cancellation rate?"],
    )


class ChartData(BaseModel):
    """Chart visualization data returned by the assistant."""
    type: str
    x_key: str | None = None
    y_key: str | None = None
    data: list[dict] = []


class AssistantQueryResponse(BaseModel):
    """Response body for the AI assistant query endpoint."""
    question: str
    generated_sql: str | None = None
    columns: list[str] = []
    rows: list[list] = []
    summary: str
    chart: ChartData
    is_error: bool = False


@router.post("/query", response_model=AssistantQueryResponse)
def query_assistant(request: AssistantQueryRequest):
    """
    Process a natural language business question.

    Converts the question to SQL via Gemini, executes it on the SQLite
    database, and returns results with a business insight summary and
    auto-selected chart data.

    - Conversational messages (greetings, help requests) get a friendly reply.
    - Dangerous SQL is rejected before execution.
    - All errors are returned as structured responses (never 500s).
    """
    logger.info("AI Assistant query: %s", request.question[:120])

    try:
        result = process_question(request.question)
    except Exception as exc:
        # Absolute last-resort catch — should not normally trigger
        logger.error("Unhandled AI Assistant error: %s", exc)
        result = {
            "question": request.question,
            "generated_sql": None,
            "columns": [],
            "rows": [],
            "summary": (
                "An unexpected error occurred. "
                "Please try again or rephrase your question."
            ),
            "chart": {"type": "none", "x_key": None, "y_key": None, "data": []},
            "is_error": True,
        }

    return AssistantQueryResponse(**result)
