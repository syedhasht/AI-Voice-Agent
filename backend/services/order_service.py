from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc

from models.order import Order
from models.timeline import TimelineEntry
from models.call_log import CallLog
from schemas.order import OrderCreate, OrderUpdate


class OrderService:
    @staticmethod
    def create(db: Session, data: OrderCreate) -> Order:
        order = Order(
            customer_name=data.customer_name.strip(),
            phone_number=data.phone_number.strip(),
            medicine_name=data.medicine_name.strip(),
            quantity=data.quantity,
            notes=data.notes.strip() if data.notes else None,
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        # Add initial timeline entry for Order Created
        entry = TimelineEntry(
            order_id=order.id,
            status="pending",
            note="Order registered in the system"
        )
        db.add(entry)
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def get_all(db: Session) -> list[Order]:
        return db.query(Order).order_by(desc(Order.created_at)).all()

    @staticmethod
    def get_by_id(db: Session, order_id: int) -> Optional[Order]:
        return db.query(Order).filter(Order.id == order_id).first()

    @staticmethod
    def update(db: Session, db_order: Order, data: OrderUpdate) -> Order:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
          if value is not None:
            if isinstance(value, str):
              value = value.strip()
            setattr(db_order, field, value)

        if data.transcript_json is not None:
          duration = data.call_duration_seconds or 0
          outcome = db_order.status.value if db_order.status else "COMPLETED"
          msg = f"Browser simulation call completed. Duration: {duration}s. Outcome: {outcome.upper()}"
          log_entry = CallLog(
            order_id=db_order.id,
            step="call_completed",
            message=msg
          )
          db.add(log_entry)

        db.commit()
        db.refresh(db_order)
        return db_order

    @staticmethod
    def delete(db: Session, db_order: Order) -> None:
        db.delete(db_order)
        db.commit()
