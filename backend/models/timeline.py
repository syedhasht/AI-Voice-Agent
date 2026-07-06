from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database.session import Base


class TimelineEntry(Base):
    __tablename__ = "timeline_entries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    order = relationship("Order", back_populates="timeline")

    def __repr__(self):
        return f"<TimelineEntry(id={self.id}, order={self.order_id}, status={self.status})>"
