from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship

from database.session import Base


class CallAnalytic(Base):
    __tablename__ = "call_analytics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    call_id = Column(Integer, ForeignKey("calls.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    summary = Column(Text, nullable=True)
    intent = Column(String(255), nullable=True)
    outcome = Column(String(255), nullable=True)
    sentiment = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=True)
    next_action = Column(String(255), nullable=True)

    call = relationship("Call", back_populates="analytic")

    def __repr__(self):
        return f"<CallAnalytic(id={self.id}, call_id={self.call_id}, sentiment={self.sentiment})>"
