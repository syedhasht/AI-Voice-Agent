from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from database.session import SessionLocal
from models.order import Order
from models.timeline import TimelineEntry
from models.call_log import CallLog
from utils.logger import get_logger
from utils.status import OrderStatus

logger = get_logger(__name__)
router = APIRouter(prefix="/webhooks/elevenlabs", tags=["ElevenLabs Webhooks"])


class ElevenLabsWebhookPayload(BaseModel):
    event: Optional[str] = None
    conversation_id: Optional[str] = None
    status: Optional[str] = None
    transcript: Optional[list[dict[str, Any]]] = None
    metadata: Optional[dict[str, Any]] = None
    duration_seconds: Optional[int] = None


@router.post("")
async def receive_webhook(payload: ElevenLabsWebhookPayload, request: Request):
    logger.info("ElevenLabs webhook received — event=%s conv=%s", payload.event, payload.conversation_id)

    event_type = payload.event or payload.status
    conversation_id = payload.conversation_id
    if not conversation_id:
        logger.warning("Webhook missing conversation_id")
        return {"status": "ignored", "reason": "missing conversation_id"}

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.conversation_id == conversation_id).first()
        if not order:
            logger.warning("No order found for conversation_id=%s", conversation_id)
            return {"status": "ignored", "reason": "order_not_found"}

        order.transcript_json = str(payload.transcript) if payload.transcript else order.transcript_json
        if payload.duration_seconds:
            order.call_duration_seconds = payload.duration_seconds
        order.updated_at = datetime.now(timezone.utc)

        if event_type == "conversation_completed":
            logger.info("Conversation completed for order %s", order.id)
            if order.status in (OrderStatus.SIMULATING, OrderStatus.PENDING, OrderStatus.CALLING, OrderStatus.IN_PROGRESS):
                order.status = OrderStatus.COMPLETED
                _add_timeline(db, order.id, OrderStatus.COMPLETED.value, "ElevenLabs conversation completed")
                _add_call_log(db, order.id, "conversation_completed", "Conversation finished")

        db.commit()
        db.refresh(order)
        logger.info("Order %s updated from webhook", order.id)
        return {"status": "ok", "order_id": order.id}

    except Exception as exc:
        db.rollback()
        logger.error("Webhook processing failed — %s", exc)
        raise HTTPException(status_code=500, detail="Webhook processing failed")
    finally:
        db.close()


@router.post("/tool-result")
async def receive_tool_result(request: Request):
    body = await request.json()
    logger.info("ElevenLabs tool result — %s", body)
    return {"status": "ok"}


def _add_timeline(db: SessionLocal, order_id: int, status: str, note: str = "") -> None:
    entry = TimelineEntry(order_id=order_id, status=status, note=note)
    db.add(entry)


def _add_call_log(db: SessionLocal, order_id: int, step: str, message: str = "") -> None:
    log = CallLog(order_id=order_id, step=step, message=message)
    db.add(log)
