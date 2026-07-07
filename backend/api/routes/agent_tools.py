from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database.session import SessionLocal
from models.order import Order
from models.timeline import TimelineEntry
from models.call_log import CallLog
from utils.logger import get_logger
from utils.status import OrderStatus

logger = get_logger(__name__)
router = APIRouter(prefix="/agent", tags=["Agent Tools"])


class ConfirmOrderRequest(BaseModel):
    order_id: int


class ModifyOrderRequest(BaseModel):
    order_id: int
    quantity: int


class CancelOrderRequest(BaseModel):
    order_id: int


class RequestHumanRequest(BaseModel):
    order_id: int
    reason: Optional[str] = ""


def _get_order_or_404(order_id: int):
    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return db, order
    except HTTPException:
        db.close()
        raise
    except Exception as exc:
        db.close()
        logger.error("Failed to fetch order %s — %s", order_id, exc)
        raise HTTPException(status_code=500, detail="Failed to fetch order")


def _add_timeline(db: SessionLocal, order_id: int, status: str, note: str = "") -> None:
    entry = TimelineEntry(order_id=order_id, status=status, note=note)
    db.add(entry)


def _add_call_log(db: SessionLocal, order_id: int, step: str, message: str = "") -> None:
    log = CallLog(order_id=order_id, step=step, message=message)
    db.add(log)


@router.post("/confirm-order")
def confirm_order(body: ConfirmOrderRequest):
    db, order = _get_order_or_404(body.order_id)
    try:
        order.status = OrderStatus.COMPLETED
        order.updated_at = datetime.now(timezone.utc)
        _add_timeline(db, order.id, OrderStatus.COMPLETED.value, "Order confirmed by customer")
        _add_call_log(db, order.id, "confirmed", "Customer confirmed the order")
        db.commit()
        db.refresh(order)
        logger.info("Order %s confirmed", order.id)
        return {"status": "ok", "order_id": order.id, "order_status": order.status.value}
    except Exception as exc:
        db.rollback()
        logger.error("confirm_order failed — %s", exc)
        raise HTTPException(status_code=500, detail="Failed to confirm order")
    finally:
        db.close()


@router.post("/modify-order")
def modify_order(body: ModifyOrderRequest):
    db, order = _get_order_or_404(body.order_id)
    try:
        old_qty = order.quantity
        order.quantity = body.quantity
        order.status = OrderStatus.COMPLETED
        order.updated_at = datetime.now(timezone.utc)
        note = f"Quantity changed from {old_qty} to {body.quantity}"
        _add_timeline(db, order.id, OrderStatus.COMPLETED.value, note)
        _add_call_log(db, order.id, "modified", note)
        db.commit()
        db.refresh(order)
        logger.info("Order %s modified — qty %s -> %s", order.id, old_qty, body.quantity)
        return {
            "status": "ok",
            "order_id": order.id,
            "old_quantity": old_qty,
            "new_quantity": body.quantity,
            "order_status": order.status.value,
        }
    except Exception as exc:
        db.rollback()
        logger.error("modify_order failed — %s", exc)
        raise HTTPException(status_code=500, detail="Failed to modify order")
    finally:
        db.close()


@router.post("/cancel-order")
def cancel_order(body: CancelOrderRequest):
    db, order = _get_order_or_404(body.order_id)
    try:
        order.status = OrderStatus.REJECTED
        order.updated_at = datetime.now(timezone.utc)
        _add_timeline(db, order.id, OrderStatus.REJECTED.value, "Order cancelled by customer")
        _add_call_log(db, order.id, "cancelled", "Customer cancelled the order")
        db.commit()
        db.refresh(order)
        logger.info("Order %s cancelled", order.id)
        return {"status": "ok", "order_id": order.id, "order_status": order.status.value}
    except Exception as exc:
        db.rollback()
        logger.error("cancel_order failed — %s", exc)
        raise HTTPException(status_code=500, detail="Failed to cancel order")
    finally:
        db.close()


@router.post("/request-human")
def request_human(body: RequestHumanRequest):
    db, order = _get_order_or_404(body.order_id)
    try:
        order.status = OrderStatus.NEED_HUMAN
        order.updated_at = datetime.now(timezone.utc)
        reason = body.reason or "Customer requested human representative"
        _add_timeline(db, order.id, OrderStatus.NEED_HUMAN.value, reason)
        _add_call_log(db, order.id, "escalated", reason)
        db.commit()
        db.refresh(order)
        logger.info("Order %s escalated — %s", order.id, reason)
        return {"status": "ok", "order_id": order.id, "reason": reason, "order_status": order.status.value}
    except Exception as exc:
        db.rollback()
        logger.error("request_human failed — %s", exc)
        raise HTTPException(status_code=500, detail="Failed to escalate")
    finally:
        db.close()
