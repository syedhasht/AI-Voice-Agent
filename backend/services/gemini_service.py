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
import re
from typing import Any, Optional

import httpx

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
  "reason": "brief English explanation of the decision",
  "updated_fields": {}
}

## Status Rules
- "confirmed": Customer explicitly agreed to the order
- "modified": Customer wants to change quantity or medicine.
  Include "updated_fields": { "quantity": <new_int> } if quantity changed.
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


GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


def _call_gemini(prompt: str) -> Optional[str]:
    """
    Call the Gemini API with the given prompt via REST API.

    Args:
        prompt: Full prompt string

    Returns:
        Raw response text, or None on failure
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.error("GEMINI_API_KEY is not configured")
        return None

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 512,
        },
    }

    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                f"{GEMINI_API_URL}?key={api_key}",
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])
            if candidates:
                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return text
            logger.warning("Gemini returned no candidates")
            return None
        else:
            logger.error(
                "Gemini API error — status=%s body=%s",
                response.status_code, response.text[:300],
            )
            return None

    except httpx.TimeoutException:
        logger.error("Gemini API timed out after 20s")
        return None

    except httpx.RequestError as exc:
        logger.error("Gemini API request failed — %s", exc)
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


def _mock_analyze(
    transcript: list[dict[str, str]],
    order_context: dict[str, Any],
) -> dict[str, Any]:
    """
    Context-aware mock LLM for demo/evaluation.

    Analyzes the FULL conversation history using weighted scoring across
    multiple intent signals — confirmation, rejection, modification,
    confusion — and returns a structured result with natural Urdu responses
    as if Gemini had decided.
    """
    customer_name = order_context.get("customer_name", "Customer")
    medicine = order_context.get("medicine_name", "medicine")
    quantity = order_context.get("quantity", 1)

    # Collect all user utterances
    user_turns = [
        t.get("text", "").lower()
        for t in (transcript or [])
        if t.get("speaker", "").lower() in ("customer", "user")
    ]
    last_text = (user_turns[-1] if user_turns else "").strip()
    all_text = " ".join(user_turns)

    # Handle empty/unrecognisable input
    if not last_text:
        return {
            "status": "need_human",
            "response": (
                f"{customer_name} sahab, main aap ki baat nahi sun saka. "
                f"Dobara farmaiye, yeh {medicine} ka order {quantity} quantity ka hai."
            ),
            "reason": "Empty or unrecognisable speech input",
            "updated_fields": {},
            "new_quantity": None,
            "from_cache": False,
        }

    # ── Scoring signals ────────────────────────────────────────────
    signals = {"confirm": 0, "reject": 0, "modify": 0, "confusion": 0}

    # Confirm signal (Roman + Urdu script)
    confirm_phrases = [
        "han", "haan", "yes", "ji", "theek", "sahi", "confirm",
        "tasdeeq", "order confirm", "main confirm", "yeh order",
        "bilkul", "okay", "theek hai", "sahi hai", "acha",
        "bohat acha", "shukriya", "thanks", "right", "correct",
        "yehi hai", "yehi chahiye", "i confirm",
        # Urdu script
        "جی", "ہاں", "ٹھیک", "صحیح", "بلکل", "تسدیق", "شکریہ",
        "یہی", "یہ ٹھیک", "یہ صحیح",
    ]
    for phrase in confirm_phrases:
        if phrase in last_text:
            signals["confirm"] += 2
        elif phrase in all_text:
            signals["confirm"] += 1

    # Reject signal (Roman + Urdu script)
    reject_phrases = [
        "nahi", "nhi", "no", "cancel", "nahi chahiye",
        "manhoos", "galt", "galat", "ghalat", "ghalt", "ghalth",
        "yeh nahi", "na", "cancel kar do",
        "nahi lena", "nahi dena", "band karo", "i don't want",
        "not interested", "wrong order", "wrong medicine",
        # Urdu script
        "نہیں", "غلط", "گلط", "نہیں چاہیے", "نہیں لینا",
        "منسوخ", "یہ نہیں", "غلط آرڈر",
    ]
    for phrase in reject_phrases:
        if phrase in last_text:
            signals["reject"] += 2
        elif phrase in all_text:
            signals["reject"] += 1

    # Modify signal — look for quantity/medicine change across ALL turns
    # (Note: word-numbers like 'do', 'teen' are NOT in this list;
    #  they are handled via word_number_map below to avoid false positives.)
    modify_phrases = [
        "badal", "change", "kam", "zyada", "quantity",
        "different", "instead", "replace", "takhreeb",
        "aur",
        # Urdu script
        "کوالٹی", "مقدار", "تبدیل", "بدل", "کم", "زیادہ", "اور",
    ]
    for phrase in modify_phrases:
        if phrase in last_text:
            signals["modify"] += 2
        elif phrase in all_text:
            signals["modify"] += 1

    # Word number mapping (Roman + Urdu script)
    word_number_map = {
        "do": 2, "teen": 3, "char": 4, "paanch": 5,
        "chhe": 6, "saat": 7, "aath": 8, "nau": 9, "das": 10,
        "ایک": 1, "دو": 2, "تین": 3, "چار": 4, "پانچ": 5,
        "چھ": 6, "سات": 7, "آٹھ": 8, "نو": 9, "دس": 10,
    }

    # Extract numbers for quantity changes (digits + word-numbers)
    # Collect ALL valid numbers, then use the LAST one as the target.
    # This handles "from 1 to 2" patterns where the last number is the desired quantity.
    all_numbers: list[int] = []
    tokens = last_text.split()
    for i, token in enumerate(tokens):
        clean = token.strip(".,!?")
        candidate = None
        if clean.isdigit():
            candidate = int(clean)
        elif clean in word_number_map:
            # Guard: "do" after "kar" is a verb ("kar do" = do it), not the number 2
            if clean == "do" and i > 0 and tokens[i - 1] == "kar":
                continue
            candidate = word_number_map[clean]
        if candidate is not None and 1 <= candidate <= 100:
            all_numbers.append(candidate)

    new_quantity = None
    if all_numbers:
        last_num = all_numbers[-1]
        if last_num != quantity:
            new_quantity = last_num
            signals["modify"] = max(signals["modify"], 2)

    # Confusion signal (Roman + Urdu script)
    confusion_phrases = [
        "kya", "samajh", "nahi aaya", "dubara", "again",
        "what", "mean", "matlab", "yeh kya", "kaise",
        "batayein", "mujhe samajh", "kya bol rahe",
        "hello", "are you there", "can you repeat",
        # Urdu script
        "کیا", "سمجھ", "نہیں سمجھ", "نہیں آیا", "دوبارہ",
        "کیا کہا", "مطلب", "یہ کیا",
    ]
    for phrase in confusion_phrases:
        if phrase in last_text:
            signals["confusion"] += 2

    # Few words / silence-like
    if 0 < len(last_text.split()) <= 2:
        signals["confusion"] += 1

    # ── Signal conflict resolution ──────────────────────────────────
    # If a specific quantity change is detected, rejection words likely
    # negate the old value ("teen nahi paanch" = "not 3 but 5"), not the order.
    if new_quantity is not None and signals["modify"] >= 2:
        signals["reject"] = 0

    # ── Multi-turn patterns ────────────────────────────────────────
    # If user agreed in a previous turn but now says something else
    prior_confirm_keys = [p for p in confirm_phrases if len(p) > 2]
    has_prior_confirm = any(
        any(cp in t for cp in prior_confirm_keys)
        for t in user_turns[:-1]
    )
    prior_reject_keys = [p for p in reject_phrases if len(p) > 2]
    has_prior_reject = any(
        any(rp in t for rp in prior_reject_keys)
        for t in user_turns[:-1]
    )

    if has_prior_confirm and signals["reject"] >= 2:
        signals["confusion"] += 3  # conflicting signals

    # ── Decision ───────────────────────────────────────────────────
    # Priority: confusion > rejection > modification > confirmation
    if signals["confusion"] >= 3:
        return {
            "status": "need_human",
            "response": (
                f"{customer_name} sahab, maaf karein, mujhe samajh nahi aaya. "
                f"Kya aap dobara bata sakte hain? Aap ne {medicine} ka order "
                f"{quantity} quantity ka diya hai."
            ),
            "reason": "Customer expression unclear or conflicting — needs human",
            "updated_fields": {},
            "new_quantity": None,
            "from_cache": False,
        }

    if signals["reject"] > signals["confirm"] and signals["reject"] >= 2:
        return {
            "status": "rejected",
            "response": (
                f"Ji theek hai, {customer_name} sahab. "
                f"Aap ka {medicine} ka order cancel kar diya gaya hai. "
                f"Koi aur madad chahiye to batayein. Allah Hafiz!"
            ),
            "reason": "Customer rejected the order",
            "updated_fields": {},
            "new_quantity": None,
            "from_cache": False,
        }

    if signals["modify"] >= 2 and new_quantity:
        return {
            "status": "modified",
            "response": (
                f"Ji {customer_name} sahab! Quantity {quantity} se "
                f"{new_quantity} kar di gayi hai. "
                f"{medicine} - {new_quantity} ki quantity ke saath "
                f"aap ka order confirm hai. Kya yeh theek hai?"
            ),
            "reason": f"Customer changed quantity from {quantity} to {new_quantity}",
            "updated_fields": {"quantity": new_quantity},
            "new_quantity": new_quantity,
            "from_cache": False,
        }

    if signals["confirm"] >= 2 or signals["confirm"] > signals["reject"]:
        return {
            "status": "confirmed",
            "response": (
                f"Shukriya {customer_name} sahab! "
                f"Aap ka order — {medicine}, {quantity} ki quantity — "
                f"confirm kar diya gaya hai. Allah Hafiz!"
            ),
            "reason": "Customer confirmed the order",
            "updated_fields": {},
            "new_quantity": None,
            "from_cache": False,
        }

    # If the user engaged at all and no strong negative signal → confirm
    return {
        "status": "confirmed",
        "response": (
            f"Shukriya {customer_name} sahab! "
            f"Aap ka order — {medicine}, {quantity} ki quantity — "
            f"confirm kar diya gaya hai. Allah Hafiz!"
        ),
        "reason": "Customer engaged positively, order confirmed",
        "updated_fields": {},
        "new_quantity": None,
        "from_cache": False,
    }


def analyze(
    transcript: list[dict[str, str]],
    order_context: dict[str, Any],
) -> dict[str, Any]:
    """
    Analyze a call transcript using Gemini to determine outcome and next response.

    In mock/demo mode (no GEMINI_API_KEY), uses keyword matching instead.
    Falls back to a safe Urdu apology on any failure.

    Args:
        transcript: List of conversation turns
        order_context: Dict with order_id, customer_name, medicine_name, quantity

    Returns:
        dict with:
            - status: str — confirmed | modified | rejected | need_human
            - response: str — Urdu response text for Retell to speak
            - reason: str — English explanation
            - updated_fields: dict — any field changes (e.g. {"quantity": 5})
            - new_quantity: Optional[int] — if status is "modified"
            - from_cache: bool — True if fallback was used

    On any failure, returns a safe fallback:
        {"status": "need_human", "response": "...", "reason": "..."}
    """
    # Use mock mode when AI_PROVIDER is "mock" (demo/evaluation)
    if settings.AI_PROVIDER == "mock":
        logger.info(
            "Mock mode — analyzing transcript for order %s (%d turns)",
            order_context.get("order_id"),
            len(transcript or []),
        )
        return _mock_analyze(transcript, order_context)

    prompt = build_prompt(transcript, order_context)

    logger.info(
        "Gemini — analyzing transcript for order %s (%d turns)",
        order_context.get("order_id"),
        len(transcript or []),
    )

    raw = _call_gemini(prompt)
    parsed = _parse_response(raw) if raw else None

    if parsed:
        updated_fields = parsed.get("updated_fields") or {}
        new_quantity = updated_fields.get("quantity") or parsed.get("new_quantity")

        result = {
            "status": parsed["status"],
            "response": parsed.get("response", ""),
            "reason": parsed.get("reason", ""),
            "updated_fields": updated_fields,
            "new_quantity": new_quantity,
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
        "updated_fields": {},
        "new_quantity": None,
        "from_cache": True,
    }
