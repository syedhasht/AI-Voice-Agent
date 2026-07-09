from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database.session import Base


class VoiceSession(Base):
    __tablename__ = "voice_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    elevenlabs_session_id = Column(String(255), nullable=True, index=True)
    conversation_id = Column(String(255), nullable=True, index=True)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=False)
    status = Column(String(50), nullable=False)

    order = relationship("Order", back_populates="voice_sessions")

    def __repr__(self):
        return f"<VoiceSession(id={self.id}, order={self.order_id}, session_id={self.elevenlabs_session_id})>"
