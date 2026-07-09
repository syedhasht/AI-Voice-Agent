"""
AI Assistant Service — Main Orchestrator

Coordinates the full pipeline:
  1. Detect conversational vs. analytical question
  2. Generate SQL via Gemini (sql_generator)
  3. Validate SQL for security (sql_validator)
  4. Execute SQL on SQLite (sql_executor)
  5. Select chart type (chart_selector)
  6. Generate business explanation (explanation_service)
  7. Return unified response dict

All errors are caught at this level and returned as structured
error responses — never as unhandled exceptions.
"""

from typing import Any, Dict, List, Optional

from utils.logger import get_logger

from .chart_selector import select_chart
from .explanation_service import (
    generate_conversational_response,
    generate_explanation,
)
from .sql_executor import execute_sql, get_schema_info
from .sql_generator import generate_sql
from .sql_validator import validate_sql

logger = get_logger(__name__)


def _build_error_response(
    question: str,
    error_message: str,
    generated_sql: Optional[str] = None,
) -> Dict[str, Any]:
    """Build a consistent error response dict."""
    return {
        "question": question,
        "generated_sql": generated_sql,
        "columns": [],
        "rows": [],
        "summary": error_message,
        "chart": {"type": "none", "x_key": None, "y_key": None, "data": []},
        "is_error": True,
    }


def process_question(question: str) -> Dict[str, Any]:
    """
    Process a user's business question through the full NL → SQL → Insight pipeline.

    Args:
        question: The user's natural language business question.

    Returns:
        A dict with keys:
          - question (str): Original question
          - generated_sql (str | None): The SQL that was executed
          - columns (list[str]): Column names
          - rows (list[list]): Result rows
          - summary (str): Business insight or conversational response
          - chart (dict): Chart data { type, x_key, y_key, data }
          - is_error (bool): True if an error occurred
    """
    question = (question or "").strip()

    if not question:
        return _build_error_response(
            question="",
            error_message=(
                "Please enter a question. Try: "
                "'Which medicine has the highest cancellation rate?'"
            ),
        )

    logger.info("AI Assistant processing question: %s", question[:120])

    # ── Step 1: Fast conversational detection (no DB/API needed) ─────
    # Check this BEFORE any schema retrieval or Gemini calls so simple
    # greetings get an instant response without hanging on external calls.
    from .sql_generator import _is_conversational  # local import avoids circular
    if _is_conversational(question):
        logger.info("Conversational question — returning instant reply")
        response_text = (
            "Hi! I'm your Enterprise AI Business Assistant — powered by Gemini.\n"
            "Ask me anything about your pharmacy data and I'll query the live database for you.\n\n"
            "• Which medicine has the highest cancellation rate?\n"
            "• Show revenue by city\n"
            "• Which customers need a callback?\n"
            "• Compare today's calls with yesterday\n"
            "• Which AI agent handled the most conversations?"
        )
        return {
            "question": question,
            "generated_sql": None,
            "columns": [],
            "rows": [],
            "summary": response_text,
            "chart": {"type": "none", "x_key": None, "y_key": None, "data": []},
            "is_error": False,
        }

    # ── Step 2: Retrieve database schema ──────────────────────────────
    try:
        schema = get_schema_info()
    except Exception as exc:
        logger.error("Schema retrieval failed: %s", exc)
        return _build_error_response(
            question=question,
            error_message="Failed to connect to the database. Please try again.",
        )

    # ── Step 3: Generate SQL via Gemini ───────────────────────────────
    try:
        gen_result = generate_sql(question, schema)
    except Exception as exc:
        logger.error("SQL generation failed: %s", exc)
        return _build_error_response(
            question=question,
            error_message=f"SQL generation failed: {exc}",
        )

    # ── Step 3a: SQL generation error ─────────────────────────────────
    if gen_result.get("error"):
        err_msg = gen_result["error"]
        if "cannot be answered from the available database schema" in err_msg:
            logger.info("Unsupported question — falling back to conversational explanation")
            try:
                conversational_reply = generate_conversational_response(question)
                return {
                    "question": question,
                    "generated_sql": None,
                    "columns": [],
                    "rows": [],
                    "summary": conversational_reply,
                    "chart": {"type": "none", "x_key": None, "y_key": None, "data": []},
                    "is_error": False,
                }
            except Exception as exc:
                logger.warning("Conversational fallback generation failed: %s", exc)

        return _build_error_response(
            question=question,
            error_message=err_msg,
        )

    sql = gen_result["sql"]

    # ── Step 4: Validate SQL ───────────────────────────────────────────
    is_valid, validation_reason = validate_sql(sql)
    if not is_valid:
        logger.warning("SQL validation rejected: %s | SQL: %s", validation_reason, sql[:200])
        return _build_error_response(
            question=question,
            generated_sql=sql,
            error_message=(
                f"Security validation failed: {validation_reason} "
                "Only read-only SELECT queries are permitted."
            ),
        )

    # ── Step 5: Execute SQL ────────────────────────────────────────────
    try:
        columns, rows = execute_sql(sql)
    except RuntimeError as exc:
        return _build_error_response(
            question=question,
            generated_sql=sql,
            error_message=str(exc),
        )
    except Exception as exc:
        logger.error("Unexpected SQL execution error: %s", exc)
        return _build_error_response(
            question=question,
            generated_sql=sql,
            error_message="An unexpected database error occurred. Please try again.",
        )

    # ── Step 6: Auto-select chart ─────────────────────────────────────
    try:
        chart = select_chart(columns, rows)
    except Exception as exc:
        logger.warning("Chart selection failed: %s", exc)
        chart = {"type": "none", "x_key": None, "y_key": None, "data": []}

    # ── Step 7: Generate business explanation via Gemini ──────────────
    try:
        summary = generate_explanation(question, sql, columns, rows)
    except Exception as exc:
        logger.warning("Explanation generation failed: %s", exc)
        summary = f"Query returned {len(rows)} result(s)."

    logger.info(
        "AI Assistant complete — rows=%d cols=%d chart=%s",
        len(rows), len(columns), chart.get("type"),
    )

    return {
        "question": question,
        "generated_sql": sql,
        "columns": columns,
        "rows": rows,
        "summary": summary,
        "chart": chart,
        "is_error": False,
    }
