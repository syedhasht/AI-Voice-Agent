from typing import Optional

from sqlalchemy.orm import Session

from models.call_log import CallLog


class CallLogService:
    @staticmethod
    def add_entry(db: Session, order_id: int, step: str, message: Optional[str] = None) -> CallLog:
        entry = CallLog(
            order_id=order_id,
            step=step,
            message=message,
        )
        db.add(entry)
        db.flush()
        return entry
