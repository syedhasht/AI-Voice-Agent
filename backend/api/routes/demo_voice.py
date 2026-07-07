"""
Simulate Call / Demo Voice Routes

Browser-based AI voice simulation for evaluator use.
Completely independent of Retell/Twilio production flow.

Endpoints:
    POST /api/demo/simulate-call/{order_id}
        → Initialises a simulation session, sets SIMULATING status,
          returns AI greeting.

    POST /api/demo/voice-turn
        → Processes one user utterance, calls GeminiService,
          updates order in DB, returns AI response.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database.session import SessionLocal
from models.order import Order
from models.timeline import TimelineEntry
from models.call_log import CallLog
from config import get_settings
from services.gemini_service import analyze as gemini_analyze
from services.elevenlabs_agent_service import create_signed_url
from utils.logger import get_logger
from utils.status import OrderStatus

logger = get_logger(__name__)
settings = get_settings()
router = APIRouter(prefix="/demo", tags=["Demo"])

FINAL_STATUSES = {
    OrderStatus.CONFIRMED,
    OrderStatus.REJECTED,
    OrderStatus.NEED_HUMAN,
    OrderStatus.COMPLETED,
}

SIMULATION_FINAL_STATUSES = {
    OrderStatus.CONFIRMED,
    OrderStatus.REJECTED,
    OrderStatus.NEED_HUMAN,
}


class ElevenLabsSessionResponse(BaseModel):
    agent_id: str
    order_id: int
    conversation_id: str
    signed_url: Optional[str] = None
    customer: Optional[str] = None
    medicine: Optional[str] = None
    quantity: Optional[int] = None


class StartSessionResponse(BaseModel):
    order_id: int
    greeting: str
    status: str
    transcript: list[dict[str, Any]]


class VoiceTurnRequest(BaseModel):
    order_id: int
    text: str


class VoiceTurnResponse(BaseModel):
    response_text: str
    status: str
    updated_fields: dict[str, Any]
    reason: str
    is_final: bool


class EndSessionResponse(BaseModel):
    order_id: int
    final_status: str
    reason: str
    transcript: list[dict[str, Any]]


# ---------------------------------------------------------------------------
# ElevenLabs Session
# ---------------------------------------------------------------------------


@router.post("/elevenlabs-session/{order_id}", response_model=ElevenLabsSessionResponse)
def start_elevenlabs_session(order_id: int):
    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        agent_id = settings.ELEVENLABS_AGENT_ID
        if not agent_id:
            raise HTTPException(status_code=500, detail="ELEVENLABS_AGENT_ID not configured")

        conversation_id = str(uuid.uuid4())
        order.conversation_id = conversation_id
        order.status = OrderStatus.SIMULATING
        order.updated_at = datetime.now(timezone.utc)

        # Add timeline entry
        timeline_entry = TimelineEntry(
            order_id=order.id,
            status=OrderStatus.SIMULATING.value,
            note="Simulation call started on web UI"
        )
        db.add(timeline_entry)

        # Add call log entry
        call_log_entry = CallLog(
            order_id=order.id,
            step="call_started",
            message="Browser simulation call started"
        )
        db.add(call_log_entry)
        db.commit()
        db.refresh(order)

        logger.info("ElevenLabs session created for order %s — conv=%s", order.id, conversation_id)

        signed_url = None
        try:
            signed_url = create_signed_url(order)
        except Exception as e:
            logger.warning("Failed to create ElevenLabs signed URL: %s", e)

        return ElevenLabsSessionResponse(
            agent_id=agent_id,
            order_id=order.id,
            conversation_id=conversation_id,
            signed_url=signed_url,
            customer=order.customer_name,
            medicine=order.medicine_name,
            quantity=order.quantity,
        )
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error("elevenlabs-session failed — %s", exc)
        raise HTTPException(status_code=500, detail="Failed to start ElevenLabs session")
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_order_context(order: Order) -> dict[str, Any]:
    return {
        "order_id": order.id,
        "customer_name": order.customer_name,
        "medicine_name": order.medicine_name,
        "quantity": order.quantity,
    }


def _parse_transcript_json(order: Order) -> list[dict[str, str]]:
    if not order.transcript_json:
        return []
    try:
        return json.loads(order.transcript_json)
    except (json.JSONDecodeError, TypeError):
        return []


def _save_transcript_json(db: SessionLocal, order: Order, transcript: list[dict[str, str]]) -> None:
    order.transcript_json = json.dumps(transcript, ensure_ascii=False)


def _add_timeline(db: SessionLocal, order_id: int, status: str, note: str = "") -> None:
    entry = TimelineEntry(order_id=order_id, status=status, note=note)
    db.add(entry)


def _add_call_log(db: SessionLocal, order_id: int, step: str, message: str = "") -> None:
    log = CallLog(order_id=order_id, step=step, message=message)
    db.add(log)


def _greeting(order: Order) -> str:
    return (
        f"Assalam-o-Alaikum! Main pharmacy se baat kar raha hoon. "
        f"Aapne {order.medicine_name} ka order diya hai, {order.quantity} ki quantity. "
        f"Kya aap order ki tasdeeq karna chahte hain?"
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/start-session/{order_id}", response_model=StartSessionResponse)
def start_session(order_id: int):
    """
    Initialise a voice simulation session for the given order.
    Sets order status to SIMULATING and returns an AI greeting.
    """
    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.status in FINAL_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Order is already in final state: {order.status.value}",
            )

        order.status = OrderStatus.SIMULATING
        order.updated_at = datetime.now(timezone.utc)

        greeting = _greeting(order)
        transcript = [
            {"speaker": "AI", "text": greeting, "timestamp": datetime.now(timezone.utc).isoformat()},
        ]
        order.transcript_json = json.dumps(transcript, ensure_ascii=False)

        _add_timeline(db, order.id, OrderStatus.SIMULATING.value, "Simulation started")
        _add_call_log(db, order.id, "simulation_started", "Simulation session initialised")

        db.commit()
        db.refresh(order)

        logger.info("Session started for order %s", order.id)

        return StartSessionResponse(
            order_id=order.id,
            greeting=greeting,
            status=OrderStatus.SIMULATING.value,
            transcript=transcript,
        )
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error("start_session failed — %s", exc)
        raise HTTPException(status_code=500, detail="Failed to start session")
    finally:
        db.close()


@router.post("/voice-turn", response_model=VoiceTurnResponse)
def voice_turn(body: VoiceTurnRequest):
    """
    Process a single user utterance in a simulation session.
    Calls GeminiService for intent classification, updates the order
    in SQLite, and returns the AI response.
    """
    text = body.text.strip()
    if not text:
        return VoiceTurnResponse(
            response_text="Kuch boliye. (Please say something.)",
            status=OrderStatus.SIMULATING.value,
            updated_fields={},
            reason="Empty input",
            is_final=False,
        )

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == body.order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.status not in (OrderStatus.SIMULATING, OrderStatus.MODIFIED):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot continue simulation — order status is {order.status.value}",
            )

        # Build transcript from history + new user turn
        transcript = _parse_transcript_json(order)
        transcript.append({"speaker": "Customer", "text": text, "timestamp": datetime.now(timezone.utc).isoformat()})

        order_context = _build_order_context(order)

        logger.info("Voice turn — order=%s text='%s' turn=%d", order.id, text[:80], len(transcript))

        result = gemini_analyze(transcript, order_context)
        ai_response = result.get("response", "")
        ai_status = result.get("status", "need_human")
        reason = result.get("reason", "")
        new_quantity = result.get("new_quantity")

        # Map Gemini status to OrderStatus
        new_order_status = OrderStatus.SIMULATING
        if ai_status == "confirmed":
            new_order_status = OrderStatus.CONFIRMED
        elif ai_status == "rejected":
            new_order_status = OrderStatus.REJECTED
        elif ai_status == "need_human":
            new_order_status = OrderStatus.NEED_HUMAN
        elif ai_status == "modified":
            new_order_status = OrderStatus.MODIFIED

        updated_fields: dict[str, Any] = {}

        # Apply field updates
        if new_order_status == OrderStatus.MODIFIED:
            if new_quantity is not None and new_quantity != order.quantity:
                order.quantity = new_quantity
                updated_fields["quantity"] = new_quantity

        # Append AI turn to transcript
        transcript.append({"speaker": "AI", "text": ai_response, "timestamp": datetime.now(timezone.utc).isoformat()})

        # Persist
        order.status = new_order_status
        order.notes = (order.notes or "") + f"\n[{datetime.now(timezone.utc).isoformat()}] {reason}".strip()
        _save_transcript_json(db, order, transcript)
        _add_timeline(db, order.id, new_order_status.value, reason)
        _add_call_log(db, order.id, f"simulation_{new_order_status.value}", reason)
        order.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(order)

        is_final = new_order_status in SIMULATION_FINAL_STATUSES

        logger.info(
            "Voice turn complete — order=%s status=%s is_final=%s",
            order.id, new_order_status.value, is_final,
        )

        return VoiceTurnResponse(
            response_text=ai_response,
            status=new_order_status.value,
            updated_fields=updated_fields,
            reason=reason,
            is_final=is_final,
        )

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error("voice_turn failed — %s", exc)
        raise HTTPException(status_code=500, detail="Failed to process voice turn")
    finally:
        db.close()


@router.post("/end-session/{order_id}", response_model=EndSessionResponse)
def end_session(order_id: int):
    """
    Finalize a simulation session. Transitions CONFIRMED → COMPLETED,
    returns final transcript and status summary.
    """
    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if order.status not in (OrderStatus.CONFIRMED, OrderStatus.REJECTED, OrderStatus.NEED_HUMAN, OrderStatus.MODIFIED, OrderStatus.SIMULATING):
            raise HTTPException(
                status_code=400,
                detail=f"Session cannot be ended from status: {order.status.value}",
            )

        final_status = order.status
        final_reason = ""

        if order.status == OrderStatus.CONFIRMED:
            order.status = OrderStatus.COMPLETED
            final_reason = "Order confirmed and completed successfully"
            _add_timeline(db, order.id, OrderStatus.COMPLETED.value, final_reason)
            _add_call_log(db, order.id, "session_completed", final_reason)
        elif order.status == OrderStatus.REJECTED:
            final_reason = "Order rejected by customer"
            _add_call_log(db, order.id, "session_ended", final_reason)
        elif order.status == OrderStatus.NEED_HUMAN:
            final_reason = "Session escalated — needs human intervention"
            _add_call_log(db, order.id, "session_escalated", final_reason)
        elif order.status == OrderStatus.MODIFIED:
            order.status = OrderStatus.COMPLETED
            final_reason = "Order modified and completed"
            _add_timeline(db, order.id, OrderStatus.COMPLETED.value, final_reason)
            _add_call_log(db, order.id, "session_completed", final_reason)
        elif order.status == OrderStatus.SIMULATING:
            final_reason = "Session ended without conclusive outcome"
            _add_call_log(db, order.id, "session_ended", final_reason)

        order.updated_at = datetime.now(timezone.utc)
        transcript = _parse_transcript_json(order)

        db.commit()
        db.refresh(order)

        logger.info("Session ended for order %s — final=%s", order.id, order.status.value)

        return EndSessionResponse(
            order_id=order.id,
            final_status=order.status.value,
            reason=final_reason,
            transcript=transcript,
        )

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error("end_session failed — %s", exc)
        raise HTTPException(status_code=500, detail="Failed to end session")
    finally:
        db.close()
