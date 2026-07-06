"""
Retell AI Service

Initiates outbound AI phone calls via the Retell API.

Retell now ONLY handles:
    - Speech-to-Text (customer speech → text)
    - Text-to-Speech (AI response → speech)
    - Call transport layer (dialing, SIP trunking)

All conversation intelligence (decision-making, response generation)
is handled by GeminiService via the webhook endpoint.

Flow:
    1. WorkflowService calls create_outbound_call(order)
    2. Retell API returns call_id immediately
    3. Retell handles the call conversation
    4. On call completion, Retell sends webhook to /api/webhooks/retell
    5. Webhook handler calls GeminiService to analyze transcript
    6. Webhook returns Gemini's response to Retell for TTS

API Docs: https://docs.retellai.com/api-v2/create-phone-call

Environment:
    RETELL_API_KEY  — Retell API key
    RETELL_AGENT_ID — Retell agent ID to use for calls
    TWILIO_PHONE_NUMBER — From number for outbound calls
"""

from typing import Any, Optional

import httpx

from config import get_settings
from utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

RETELL_API_BASE = "https://api.retellai.com"
RETELL_CREATE_CALL_ENDPOINT = "/v2/create-phone-call"
RETELL_API_KEY = settings.RETELL_API_KEY
RETELL_AGENT_ID = settings.RETELL_AGENT_ID
REQUEST_TIMEOUT = 15.0


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {RETELL_API_KEY}",
        "Content-Type": "application/json",
    }


def _retell_api_url(path: str) -> str:
    return f"{RETELL_API_BASE}{path}"


def create_outbound_call(order: Any) -> Optional[str]:
    """
    Initiate an outbound AI phone call via Retell API.

    Args:
        order: Order model instance with customer_name, phone_number,
               medicine_name, quantity, id

    Returns:
        retell_call_id (str) if successful, None on failure.

    The call_id is stored on the order so webhook callbacks
    can be matched to the correct order.
    """
    if not RETELL_API_KEY or not RETELL_AGENT_ID:
        logger.error(
            "RETELL_API_KEY or RETELL_AGENT_ID not configured — "
            "cannot create outbound call for order %s",
            order.id,
        )
        return None

    payload = {
        "agent_id": RETELL_AGENT_ID,
        "to_number": order.phone_number,
        "from_number": settings.TWILIO_PHONE_NUMBER,
        "metadata": {
            "order_id": order.id,
            "customer_name": order.customer_name,
            "medicine_name": order.medicine_name,
            "quantity": order.quantity,
        },
    }

    logger.info(
        "Creating Retell call for order %s → %s",
        order.id, order.phone_number,
    )

    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
            response = client.post(
                _retell_api_url(RETELL_CREATE_CALL_ENDPOINT),
                headers=_headers(),
                json=payload,
            )

        if response.status_code == 200:
            data = response.json()
            call_id = data.get("call_id")
            logger.info(
                "Retell call created — call_id=%s order_id=%s",
                call_id, order.id,
            )
            return call_id
        else:
            logger.error(
                "Retell API error — status=%s body=%s order_id=%s",
                response.status_code, response.text[:500], order.id,
            )
            return None

    except httpx.TimeoutException:
        logger.error(
            "Retell API timed out after %.1fs — order_id=%s",
            REQUEST_TIMEOUT, order.id,
        )
        return None

    except httpx.RequestError as exc:
        logger.error(
            "Retell API request failed — %s — order_id=%s",
            exc, order.id,
        )
        return None
