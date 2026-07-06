"""
Gemini LLM Service

Provides conversation intelligence for the AI Voice Agent using
Google's Gemini API.

Responsibilities:
    - Analyze call transcripts to determine order outcome
    - Generate natural Urdu/English code-switched responses
    - Extract structured data (status, quantity changes)

Flow:
    1. Webhook receives transcript from Retell
    2. GeminiService.analyze(transcript, order_context) is called
    3. Gemini returns structured JSON with status, response text, reason
    4. Webhook handler updates order status and returns response to Retell

Environment:
    GEMINI_API_KEY  — Google Gemini API key

Fallback:
    If Gemini API fails or returns invalid data, the service returns
    a safe fallback status of "need_human" with an Urdu apology message.
"""

import json
from typing import Any, Optional

from config import get_settings
from utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """You are an AI pharmacy order confirmation agent for a Pakistani pharmacy. 
You speak Urdu and English (code-switching). Your job is to:

1. Read the conversation transcript between the AI agent and the customer
2. Determine the outcome of the call
3. Generate a natural Urdu response

## Output Format
Return valid JSON only (no markdown, no code blocks):
{
  "status": "confirmed" | "modified" | "rejected" | "need_human",
  "response": "short Urdu/English response the AI should speak next",
  "reason": "brief English explanation of the decision"
}

## Status Rules
- "confirmed": Customer explicitly agreed to the order
- "modified": Customer wants to change quantity (include new_quantity as int)
- "rejected": Customer refused or hung up, or no answer
- "need_human": Customer has complex questions, wants pharmacist, or unclear intent

## Language Rules
- Response MUST be primarily Urdu (Roman/English script is OK)
- Keep response under 2 sentences
- Be polite and professional
- Use Islamic greetings (Assalam-o-Alaikum, Allah Hafiz)

## Context
The order details will be provided. Use them to personalize the response."""


def build_prompt(transcript: list[dict[str, str]], order_context: dict[str, Any]) -> str:
    """
    Build the full prompt for Gemini including transcript and order context.

    Args:
        transcript: List of turns [{"speaker": "...", "text": "..."}]
        order_context: Dict with order_id, customer_name, medicine_name, quantity

    Returns:
        Formatted prompt string
    """
    context_str = (
        f"Order Details:\n"
        f"- Order ID: {order_context.get('order_id')}\n"
        f"- Customer: {order_context.get('customer_name')}\n"
        f"- Medicine: {order_context.get('medicine_name')}\n"
        f"- Quantity: {order_context.get('quantity')}\n"
    )

    transcript_str = "\n".join(
        f"{turn.get('speaker', 'Unknown')}: {turn.get('text', '')}"
        for turn in (transcript or [])
    )

    return f"""{SYSTEM_PROMPT}

{context_str}

## Transcript
{transcript_str if transcript_str else "(No transcript available)"}

## Output
Return ONLY valid JSON."""


def _call_gemini(prompt: str) -> Optional[str]:
    """
    Call the Gemini API with the given prompt.

    Args:
        prompt: Full prompt string

    Returns:
        Raw response text, or None on failure
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.error("GEMINI_API_KEY is not configured")
        return None

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        return response.text

    except ImportError:
        logger.error("google-genai package not installed — pip install google-genai")
        return None

    except Exception as exc:
        logger.error("Gemini API call failed — %s", exc)
        return None


def _parse_response(raw: str) -> Optional[dict[str, Any]]:
    """
    Parse Gemini's JSON response, handling markdown code blocks.

    Args:
        raw: Raw response text from Gemini

    Returns:
        Parsed dict or None if invalid
    """
    if not raw:
        return None

    text = raw.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(
            line for line in lines
            if not line.strip().startswith("```")
        ).strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        logger.warning("Gemini returned invalid JSON — raw=%s", text[:200])
        return None

    # Validate required fields
    status = result.get("status")
    if status not in ("confirmed", "modified", "rejected", "need_human"):
        logger.warning("Gemini returned unknown status=%s", status)
        return None

    return result


def analyze(
    transcript: list[dict[str, str]],
    order_context: dict[str, Any],
) -> dict[str, Any]:
    """
    Analyze a call transcript using Gemini to determine outcome and next response.

    Args:
        transcript: List of conversation turns
        order_context: Dict with order_id, customer_name, medicine_name, quantity

    Returns:
        dict with:
            - status: str — confirmed | modified | rejected | need_human
            - response: str — Urdu response text for Retell to speak
            - reason: str — English explanation
            - new_quantity: Optional[int] — if status is "modified"
            - from_cache: bool — True if fallback was used

    On any failure, returns a safe fallback:
        {"status": "need_human", "response": "...", "reason": "..."}
    """
    prompt = build_prompt(transcript, order_context)

    logger.info(
        "Analyzing transcript for order %s (%d turns)",
        order_context.get("order_id"),
        len(transcript or []),
    )

    raw = _call_gemini(prompt)
    parsed = _parse_response(raw) if raw else None

    if parsed:
        result = {
            "status": parsed["status"],
            "response": parsed.get("response", ""),
            "reason": parsed.get("reason", ""),
            "new_quantity": parsed.get("new_quantity"),
            "from_cache": False,
        }
        logger.info(
            "Gemini analysis complete — status=%s reason=%s",
            result["status"], result["reason"],
        )
        return result

    # Fallback
    logger.warning(
        "Gemini analysis failed for order %s — using fallback",
        order_context.get("order_id"),
    )
    return {
        "status": "need_human",
        "response": "Maaf karein, hum aap se baad mein rabta karenge. Allah Hafiz.",
        "reason": "Gemini API call failed or returned invalid data",
        "new_quantity": None,
        "from_cache": True,
    }
