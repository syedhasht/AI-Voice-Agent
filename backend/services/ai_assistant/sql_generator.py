"""
SQL Generator

Converts natural language business questions to SQLite-compatible SQL
using the Google Gemini API (via the existing httpx REST pattern).

Design:
  - Reads GEMINI_API_KEY from settings (no hardcoding)
  - Reuses the same httpx call pattern as gemini_service.py
  - Provides full database schema as context
  - Detects conversational messages (greetings, meta-questions)
    and returns a direct response instead of SQL
  - Returns a dict with keys:
      sql                   — generated SQL string or None
      is_conversational     — True if question didn't need SQL
      conversational_response — direct text reply for non-SQL questions
      error                 — error message if generation failed
  - Gemini timeout: 8 seconds (fail fast on rate limits / errors)
  - On 429 rate limit: returns immediate friendly error, no waiting
"""

import re
from typing import Any, Dict, Optional

import httpx

from config import get_settings
from utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)

RATE_LIMIT_ERROR = (
    "⚠️ Gemini API rate limit reached. Your free-tier quota has been exceeded. "
    "Please wait 1 minute and try again, or upgrade your Gemini API plan at "
    "https://ai.google.dev/gemini-api/docs/rate-limits"
)

# Conversational trigger patterns — these questions don't need SQL
_CONVERSATIONAL_PATTERNS = [
    r"^hi\b",
    r"^hello\b",
    r"^hey\b",
    r"^how are you",
    r"^what (can|do) you do",
    r"^who are you",
    r"^what is your (name|purpose)",
    r"^help\b",
    r"^thanks\b",
    r"^thank you",
    r"^good (morning|evening|afternoon|night)",
    r"^what('s| is) up",
    r"^tell me about yourself",
]


def _is_conversational(question: str) -> bool:
    """Check if the question is conversational (doesn't need SQL)."""
    q = question.strip().lower()
    for pattern in _CONVERSATIONAL_PATTERNS:
        if re.search(pattern, q):
            return True
    return False


def _build_schema_context(schema: Dict[str, Any]) -> str:
    """Format the database schema dict into a readable string for Gemini."""
    lines = []
    for table, columns in schema.items():
        col_str = ", ".join(
            f"{c['name']} ({c['type']})" for c in columns
        )
        lines.append(f"  TABLE {table}: {col_str}")
    return "\n".join(lines)


def _build_sql_prompt(question: str, schema_context: str) -> str:
    """Build the full prompt for SQL generation."""
    return f"""You are an enterprise SQL analyst for a pharmacy order management system.

DATABASE SCHEMA (SQLite):
{schema_context}

IMPORTANT CONTEXT:
- orders.status values: 'pending', 'confirmed', 'rejected', 'need_human', 'modified', 'in_call', 'simulating', 'processing', 'queued', 'completed', 'in_progress', 'calling'
- calls.outcome values: same as order status values
- calls.sentiment values: 'Positive', 'Negative', 'Neutral'
- Revenue is calculated as: orders.quantity * medicines.unit_price (join orders with medicines on orders.medicine_id = medicines.id)
- For "today" use: DATE(created_at) = DATE('now')
- For "yesterday" use: DATE(created_at) = DATE('now', '-1 day')
- For "this week" use: DATE(created_at) >= DATE('now', '-7 days')
- "callback" or "need human" means: calls.outcome = 'need_human' OR orders.status = 'need_human'
- "cancellation" or "rejected" means: status = 'rejected'
- "confirmation" or "confirmed" means: status = 'confirmed'
- "sales" or "revenue" means: SUM(orders.quantity * medicines.unit_price)
- Always use LIMIT 50 unless the user asks for a specific number
- Use aliases for columns to make them human-readable (e.g., COUNT(*) AS total_calls)
- For date grouping, use strftime('%Y-%m-%d', created_at) AS date
- For hour grouping, use strftime('%H', started_at) AS hour

TASK:
Convert the following business question into a valid SQLite SELECT query.

RULES:
1. Return ONLY the raw SQL — no markdown, no backticks, no explanation
2. The query MUST start with SELECT
3. Never use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, PRAGMA
4. Use proper JOINs when data spans multiple tables
5. Handle NULL values with COALESCE where appropriate
6. If the question cannot be answered from the schema, return: UNSUPPORTED

QUESTION: {question}

SQL:"""


def _call_gemini_raw(prompt: str) -> Dict[str, Any]:
    """
    Call the Gemini API and return a result dict.
    Returns: { "text": str | None, "rate_limited": bool, "error": bool }
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.error("GEMINI_API_KEY is not configured")
        return {"text": None, "rate_limited": False, "error": True}

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 1024,
        },
    }

    try:
        with httpx.Client(timeout=8.0) as client:
            response = client.post(
                f"{GEMINI_API_URL}?key={api_key}",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])
            if candidates:
                text = (
                    candidates[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                    .strip()
                )
                return {"text": text, "rate_limited": False, "error": False}
            logger.warning("Gemini returned no candidates for SQL generation")
            return {"text": None, "rate_limited": False, "error": False}

        elif response.status_code == 429:
            logger.warning("Gemini API rate limit (429) — quota exceeded")
            return {"text": None, "rate_limited": True, "error": False}

        else:
            logger.error(
                "Gemini API error — status=%s body=%s",
                response.status_code,
                response.text[:300],
            )
            return {"text": None, "rate_limited": False, "error": True}

    except httpx.TimeoutException:
        logger.error("Gemini API timed out during SQL generation (8s)")
        return {"text": None, "rate_limited": False, "error": True}
    except httpx.RequestError as exc:
        logger.error("Gemini API request failed — %s", exc)
        return {"text": None, "rate_limited": False, "error": True}


def _clean_sql(raw: str) -> Optional[str]:
    """
    Strip markdown fences and whitespace from Gemini's SQL response.
    Returns None if it doesn't look like valid SQL.
    """
    if not raw:
        return None

    text = raw.strip()

    # Strip markdown code fences: ```sql ... ``` or ``` ... ```
    if text.startswith("```"):
        lines = text.split("\n")
        inner = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        text = "\n".join(inner).strip()

    text = text.strip("`").strip()

    if not text.upper().startswith("SELECT"):
        return None

    return text


def generate_sql(question: str, schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert a natural language question to a SQL query using Gemini.

    Args:
        question: The user's business question.
        schema: Database schema dict from sql_executor.get_schema_info().

    Returns:
        Dict with keys:
          - sql (str | None): Generated SQL or None
          - is_conversational (bool): True if question was conversational
          - conversational_response (str | None): Direct reply for greetings/meta
          - error (str | None): Error message if generation failed
    """
    question = question.strip()

    if not question:
        return {
            "sql": None,
            "is_conversational": True,
            "conversational_response": (
                "Please ask me a business question, for example: "
                "'Which medicine has the highest cancellation rate?'"
            ),
            "error": None,
        }

    # Handle greetings and meta-questions without calling Gemini for SQL
    if _is_conversational(question):
        logger.info("Conversational question detected: %s", question[:80])
        return {
            "sql": None,
            "is_conversational": True,
            "conversational_response": None,
            "error": None,
        }

    schema_context = _build_schema_context(schema)
    prompt = _build_sql_prompt(question, schema_context)

    result = _call_gemini_raw(prompt)

    # Rate limit — return immediately with helpful message
    if result["rate_limited"]:
        return {
            "sql": None,
            "is_conversational": False,
            "conversational_response": None,
            "error": RATE_LIMIT_ERROR,
        }

    # Any other Gemini error
    if result["error"] or not result["text"]:
        return {
            "sql": None,
            "is_conversational": False,
            "conversational_response": None,
            "error": (
                "Gemini API did not return a response. "
                "Please check your GEMINI_API_KEY or try again in a moment."
            ),
        }

    raw_response = result["text"]

    if raw_response.strip().upper() == "UNSUPPORTED":
        return {
            "sql": None,
            "is_conversational": False,
            "conversational_response": None,
            "error": (
                "This question cannot be answered from the available database schema. "
                "Try asking about customers, orders, medicines, or calls."
            ),
        }

    sql = _clean_sql(raw_response)

    if not sql:
        logger.warning(
            "SQL generation produced non-SELECT output: %s", raw_response[:200]
        )
        return {
            "sql": None,
            "is_conversational": False,
            "conversational_response": None,
            "error": (
                "Failed to generate a valid SQL query from your question. "
                "Please try rephrasing it."
            ),
        }

    return {
        "sql": sql,
        "is_conversational": False,
        "conversational_response": None,
        "error": None,
    }
