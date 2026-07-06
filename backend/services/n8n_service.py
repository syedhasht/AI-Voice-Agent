"""
n8n Webhook Service

Sends order notifications to an n8n webhook URL when a new order
enters the workflow queue.

n8n is responsible for orchestrating downstream automation such as
triggering Retell AI outbound calls. This service only sends a
webhook notification — it does not make Retell calls.

Retry Strategy:
    - 3 attempts with exponential backoff (1s → 2s → 4s)
    - 5-second request timeout per attempt
    - Logs every attempt outcome
    - Failure does NOT block order processing

If N8N_WEBHOOK_URL is empty or not configured, the service skips
the webhook entirely and logs "N8N disabled".

Usage:
    from services.n8n_service import notify_order_created
    notify_order_created(order)
"""

import json
import time
from typing import Any, Optional
from urllib.parse import urlparse

import httpx

from config import get_settings
from utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

N8N_WEBHOOK_URL: Optional[str] = settings.N8N_WEBHOOK_URL
MAX_RETRIES: int = 3
REQUEST_TIMEOUT: float = 5.0
RETRY_DELAYS: list[float] = [1.0, 2.0, 4.0]


def build_payload(order: Any) -> dict[str, Any]:
    """
    Build the JSON payload sent to the n8n webhook.

    Args:
        order: Order model instance (from SQLAlchemy)

    Returns:
        dict with order_id, customer_name, phone_number, medicine_name,
        quantity, status, created_at, language
    """
    return {
        "order_id": order.id,
        "customer_name": order.customer_name,
        "phone_number": order.phone_number,
        "medicine_name": order.medicine_name,
        "quantity": order.quantity,
        "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
        "created_at": order.created_at.isoformat() if hasattr(order.created_at, 'isoformat') else str(order.created_at),
        "language": settings.DEFAULT_LANGUAGE,
    }


def _do_webhook_request(payload: dict[str, Any], attempt: int) -> bool:
    """
    Execute a single webhook POST request.

    Args:
        payload: JSON-serializable dict to send
        attempt: Current attempt number (for logging)

    Returns:
        True if the request succeeded (2xx status), False otherwise
    """
    start = time.time()
    try:
        logger.info(
            "n8n webhook attempt %d/%d — POST %s",
            attempt, MAX_RETRIES, N8N_WEBHOOK_URL,
        )
        with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
            response = client.post(
                N8N_WEBHOOK_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
        duration = time.time() - start
        success = 200 <= response.status_code < 300
        if success:
            logger.info(
                "n8n webhook delivered — status=%d duration=%.2fs",
                response.status_code, duration,
            )
        else:
            logger.warning(
                "n8n webhook returned %d — duration=%.2fs body=%s",
                response.status_code, duration, response.text[:200],
            )
        return success

    except httpx.TimeoutException:
        logger.warning(
            "n8n webhook timed out after %.1fs (attempt %d/%d)",
            REQUEST_TIMEOUT, attempt, MAX_RETRIES,
        )
        return False

    except httpx.RequestError as exc:
        logger.warning(
            "n8n webhook connection error — %s (attempt %d/%d)",
            exc, attempt, MAX_RETRIES,
        )
        return False


def notify_order_created(order: Any) -> bool:
    """
    Send a webhook notification to n8n that a new order has been queued.

    Args:
        order: Order model instance

    Returns:
        True if the webhook was delivered successfully (or if n8n is
        disabled / not configured). False if all retries failed.

    The caller should NOT block order processing on this result.
    """
    if not N8N_WEBHOOK_URL:
        logger.info("N8N disabled — N8N_WEBHOOK_URL is empty, skipping webhook")
        return True

    payload = build_payload(order)

    for attempt in range(1, MAX_RETRIES + 1):
        if attempt > 1:
            delay = RETRY_DELAYS[attempt - 2]
            logger.info("n8n retry in %.1fs...", delay)
            time.sleep(delay)

        if _do_webhook_request(payload, attempt):
            return True

        if attempt < MAX_RETRIES:
            logger.info("n8n webhook attempt %d failed, will retry", attempt)

    logger.error(
        "n8n webhook failed after %d attempts — order_id=%s",
        MAX_RETRIES, order.id,
    )
    return False
