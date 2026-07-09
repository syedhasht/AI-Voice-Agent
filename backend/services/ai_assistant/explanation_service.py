"""
Explanation Service

Generates human-readable business insight summaries from SQL query results
using the Google Gemini API.

Also handles conversational messages (greetings, meta-questions) by
returning a friendly assistant response without executing SQL.
"""

from typing import Any, Dict, List, Optional

import httpx

from config import get_settings
from utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)

_GREETING_PROMPT = """You are an Enterprise AI Business Assistant for a pharmaceutical order management system.
The user sent a conversational message. Respond in a friendly, professional way.

IMPORTANT: Do NOT mention the name "Gemini" or "Google". Refer to yourself as the Enterprise AI Business Assistant powered by the LLM.

You can help users answer business questions like:
- Which medicine has the highest cancellation rate?
- Which customers need a callback?
- Show revenue by city
- Compare today's calls with yesterday
- Which AI agent handled the most conversations?

Keep your response to 2-3 sentences. Be helpful and welcoming.

User message: {question}

Response:"""

_EXPLANATION_PROMPT = """You are an Enterprise AI Business Analyst for a pharmaceutical company.

IMPORTANT: Do NOT mention "Gemini" or "Google" in your summary. Refer to the model/system as the LLM.

A user asked a business question and the database returned the following results.
Provide a clear, professional business insight summary in 2-4 sentences.
Focus on what the data MEANS for the business, not just what the numbers are.
Highlight key findings, trends, or actionable insights.
Do NOT mention SQL, tables, or technical details.
Write in plain English — no markdown, no bullet points, no headers.

Question: {question}

SQL Used:
{sql}

Results Summary (first {row_count} rows of {total_rows} total):
Columns: {columns}
Data: {data_sample}

Business Insight:"""


def _call_gemini(prompt: str) -> Optional[str]:
    """Call the configured LLM API (Gemini or Groq) using the existing httpx REST pattern."""
    provider = getattr(settings, "AI_ASSISTANT_PROVIDER", "gemini").lower()

    if provider == "groq":
        api_key = settings.GROQ_API_KEY
        if not api_key:
            logger.error("GROQ_API_KEY is not configured")
            return None

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.4,
            "max_tokens": 512
        }

        try:
            with httpx.Client(timeout=8.0) as client:
                response = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    }
                )

            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
            elif response.status_code == 429:
                logger.warning("Groq explanation rate limit (429) — quota exceeded")
            else:
                logger.error(
                    "Groq explanation error — status=%s body=%s",
                    response.status_code,
                    response.text[:300]
                )
            return None

        except (httpx.TimeoutException, httpx.RequestError) as exc:
            logger.error("Groq explanation request failed — %s", exc)
            return None

    else:
        # Default: Gemini API
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return None

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 512,
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
                    return (
                        candidates[0]
                        .get("content", {})
                        .get("parts", [{}])[0]
                        .get("text", "")
                        .strip()
                    )
            elif response.status_code == 429:
                logger.warning("Gemini explanation rate limit (429)")
            else:
                logger.error(
                    "Gemini explanation error — status=%s", response.status_code
                )
            return None

        except (httpx.TimeoutException, httpx.RequestError) as exc:
            logger.error("Gemini explanation request failed — %s", exc)
            return None


def generate_conversational_response(question: str) -> str:
    """
    Generate a friendly conversational response for greetings / meta-questions.

    Args:
        question: The user's conversational message.

    Returns:
        A friendly assistant response string.
    """
    prompt = _GREETING_PROMPT.format(question=question)
    response = _call_gemini(prompt)

    if response:
        return response

    # Fallback if Gemini is unavailable
    return (
        "Hello! I'm your Enterprise AI Business Assistant. "
        "I can answer business questions about your pharmacy operations — "
        "try asking about orders, medicines, customers, or call performance!"
    )


def generate_explanation(
    question: str,
    sql: str,
    columns: List[str],
    rows: List[List[Any]],
) -> str:
    """
    Generate a business insight summary for SQL query results.

    Args:
        question: The original user question.
        sql: The SQL that was executed.
        columns: List of column names from the result.
        rows: List of result rows (each row is a list of values).

    Returns:
        A human-readable business insight string.
    """
    if not rows:
        return (
            "The query returned no results. "
            "This may mean there is no data matching your criteria, "
            "or the data range you specified contains no records."
        )

    total_rows = len(rows)
    sample_size = min(5, total_rows)
    data_sample = []
    for row in rows[:sample_size]:
        row_dict = dict(zip(columns, row))
        data_sample.append(str(row_dict))

    prompt = _EXPLANATION_PROMPT.format(
        question=question,
        sql=sql[:500],
        row_count=sample_size,
        total_rows=total_rows,
        columns=", ".join(columns),
        data_sample="\n".join(data_sample),
    )

    response = _call_gemini(prompt)

    if response:
        return response

    # Fallback: generate a smart summary from the data itself
    if not rows:
        return "No data found matching your query criteria."

    # Build a human-readable summary from the actual values
    parts = []
    for col, val in zip(columns, rows[0]):
        if val is None:
            parts.append(f"no data found for {col.replace('_', ' ')}")
        elif isinstance(val, float):
            parts.append(f"{col.replace('_', ' ')}: {val:,.2f}")
        elif isinstance(val, int):
            parts.append(f"{col.replace('_', ' ')}: {val:,}")
        else:
            parts.append(f"{col.replace('_', ' ')}: {val}")

    if len(rows) == 1:
        return f"Result: {' · '.join(parts)}."
    else:
        return (
            f"Query returned {len(rows)} record(s). "
            f"First result — {' · '.join(parts)}."
        )
