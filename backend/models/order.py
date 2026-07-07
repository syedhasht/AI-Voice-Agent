from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.orm import relationship

from database.session import Base
from utils.status import OrderStatus


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_name = Column(String(255), nullable=False, index=True)
    phone_number = Column(String(50), nullable=False)
    medicine_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(
        Enum(OrderStatus),
        default=OrderStatus.PENDING,
        nullable=False,
        index=True,
    )
    notes = Column(Text, nullable=True)
    retell_call_id = Column(String(50), nullable=True, index=True)
    conversation_id = Column(String(255), nullable=True, index=True)
    elevenlabs_session_id = Column(String(255), nullable=True, index=True)
    transcript_json = Column(Text, nullable=True)
    call_duration_seconds = Column(Integer, nullable=True)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    timeline = relationship(
        "TimelineEntry",
        back_populates="order",
        order_by="TimelineEntry.created_at",
        cascade="all, delete-orphan",
    )

    call_logs = relationship(
        "CallLog",
        back_populates="order",
        order_by="CallLog.created_at",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Order(id={self.id}, customer={self.customer_name}, status={self.status})>"
