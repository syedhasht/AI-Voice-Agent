import json
import uuid
from typing import Any, Optional

import httpx

from config import get_settings
from utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

ELEVENLABS_API_BASE = "https://api.elevenlabs.io"


def _headers() -> dict[str, str]:
    return {
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }


def create_signed_url(order: Any) -> Optional[str]:
    agent_id = settings.ELEVENLABS_AGENT_ID
    if not agent_id:
        logger.error("ELEVENLABS_AGENT_ID is not configured")
        return None

    url = f"{ELEVENLABS_API_BASE}/v1/convai/conversation/get-signed-url"
    params = {
        "agent_id": agent_id,
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(url, params=params, headers=_headers())

        if resp.status_code == 200:
            signed_url = resp.json().get("signed_url")
            logger.info("Signed URL created for order %s", order.id)
            return signed_url

        logger.error(
            "ElevenLabs signed URL error — status=%s body=%s",
            resp.status_code, resp.text[:300],
        )
        return None

    except httpx.TimeoutException:
        logger.error("ElevenLabs signed URL timed out")
        return None
    except httpx.RequestError as exc:
        logger.error("ElevenLabs signed URL request failed — %s", exc)
        return None


def get_session_context(order: Any) -> dict[str, Any]:
    return {
        "order_id": order.id,
        "customer_name": order.customer_name,
        "medicine_name": order.medicine_name,
        "quantity": order.quantity,
        "language": settings.DEFAULT_LANGUAGE,
    }


def handle_tool_call(tool_name: str, params: dict[str, Any]) -> dict[str, Any]:
    logger.info("Tool call — %s params=%s", tool_name, params)
    return {"status": "ok", "tool": tool_name, "params": params}
