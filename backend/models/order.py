from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
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
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="SET NULL"), nullable=True, index=True)
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

    @property
    def amount(self) -> float:
        if self.medicine:
            return round(self.quantity * self.medicine.unit_price, 2)
        return round(self.quantity * 10.0, 2)

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

    customer = relationship("Customer", back_populates="orders")
    medicine = relationship("Medicine", back_populates="orders")
    calls = relationship("Call", back_populates="order", cascade="all, delete-orphan")
    voice_sessions = relationship("VoiceSession", back_populates="order", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order(id={self.id}, customer={self.customer_name}, status={self.status})>"
