from sqlalchemy import Column, Integer, String, Boolean

from database.session import Base


class AIAgent(Base):
    __tablename__ = "ai_agents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_name = Column(String(100), nullable=False, index=True)
    provider = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<AIAgent(id={self.id}, name={self.agent_name}, active={self.active})>"
