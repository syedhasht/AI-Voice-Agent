"""
Webhook Routes

Receives asynchronous callbacks from Retell AI during/after calls.

Flow:
    1. Retell sends call_completed with full transcript
    2. Backend extracts transcript + order context
    3. GeminiService.analyze() determines outcome + generates response
    4. Backend updates order status, stores transcript
    5. Returns Gemini response text to Retell for speech

Retell now ONLY handles STT/TTS/telephony.
All conversation intelligence is handled by Gemini via this endpoint.
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from database.session import SessionLocal
from models.timeline import TimelineEntry
from services.call_log_service import CallLogService
from services.gemini_service import analyze as gemini_analyze
from utils.status import OrderStatus
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

STATUS_MAP = {
    "confirmed": OrderStatus.CONFIRMED,
    "modified": OrderStatus.MODIFIED,
    "rejected": OrderStatus.REJECTED,
    "need_human": OrderStatus.NEED_HUMAN,
}


@router.post("/retell")
async def retell_webhook(request: Request):
    """
    Receive Retell AI webhook callbacks.

    Expected payload:
        {
            "event": "call_completed",
            "call_id": "...",
            "transcript": [{"speaker": "...", "text": "..."}, ...],
            "metadata": {"order_id": 123, ...},
            "duration_ms": 60000,
        }

    Returns:
        {"reply": "<Gemini-generated Urdu response>"}
    """
    try:
        payload = await request.json()
    except Exception:
        logger.warning("Retell webhook received invalid JSON payload")
        return JSONResponse(
            status_code=400,
            content={"status": "error", "detail": "Invalid JSON"},
        )

    call_id = payload.get("call_id", "unknown")
    event = payload.get("event", "unknown")
    logger.info("Retell webhook — event=%s call_id=%s", event, call_id)

    if event not in ("call_completed", "call_ended"):
        return {"reply": ""}

    transcript = payload.get("transcript") or []
    metadata = payload.get("metadata") or {}
    order_id = metadata.get("order_id")

    # Fallback: if no metadata, try matching by retell_call_id
    db = SessionLocal()
    try:
        if not order_id:
            from models.order import Order
            order = db.query(Order).filter(
                Order.retell_call_id == call_id
            ).first()
            if order:
                order_id = order.id
            else:
                logger.warning(
                    "No order found for call_id=%s — webhook ignored",
                    call_id,
                )
                return {"reply": ""}

        # Reload with fresh session
        from models.order import Order
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            logger.warning("Order %s not found — webhook ignored", order_id)
            return {"reply": ""}

        # Call Gemini for intelligence
        order_context = {
            "order_id": order.id,
            "customer_name": order.customer_name,
            "medicine_name": order.medicine_name,
            "quantity": order.quantity,
        }

        logger.info(
            "Sending transcript to Gemini — order=%s turns=%d",
            order_id, len(transcript),
        )
        result = gemini_analyze(transcript, order_context)

        # Determine final status
        status_str = result.get("status", "need_human")
        final_status = STATUS_MAP.get(status_str, OrderStatus.NEED_HUMAN)

        # Update order
        order.status = final_status
        order.notes = result.get("reason", "")

        import json as json_mod
        order.transcript_json = json_mod.dumps(transcript)

        # Handle modified quantity
        new_qty = result.get("new_quantity")
        if new_qty and isinstance(new_qty, (int, float)) and int(new_qty) > 0:
            order.quantity = int(new_qty)

        # Set call duration if provided
        duration_ms = payload.get("duration_ms")
        if duration_ms:
            order.call_duration_seconds = round(duration_ms / 1000)

        # Log completion
        CallLogService.add_entry(
            db, order.id, "call_completed",
            f"Call completed. Status: {final_status.value}. Reason: {result.get('reason', '')}",
        )
        entry = TimelineEntry(
            order_id=order.id,
            status=final_status.value,
            note=f"Call completed. Duration: {order.call_duration_seconds or '?'}s.",
        )
        db.add(entry)
        db.commit()

        response_text = result.get("response", "")
        logger.info(
            "Order %s finalized — status=%s reply_len=%d",
            order_id, final_status.value, len(response_text),
        )

        return {"reply": response_text}

    except Exception:
        logger.exception("Error processing Retell webhook for call %s", call_id)
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": "Internal processing error"},
        )
    finally:
        db.close()
