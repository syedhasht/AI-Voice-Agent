from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database.session import Base


class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    outcome = Column(String(50), nullable=False, index=True)
    sentiment = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=True)

    order = relationship("Order", back_populates="calls")
    customer = relationship("Customer", back_populates="calls")
    analytic = relationship("CallAnalytic", back_populates="call", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Call(id={self.id}, order={self.order_id}, outcome={self.outcome})>"
