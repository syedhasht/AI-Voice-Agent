from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database.session import Base


class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    step = Column(String(30), nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    order = relationship("Order", back_populates="call_logs")

    def __repr__(self):
        return f"<CallLog(id={self.id}, order={self.order_id}, step={self.step})>"
