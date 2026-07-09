from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship

from database.session import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_code = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False, index=True)
    phone_number = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False, index=True)
    province = Column(String(100), nullable=False)
    gender = Column(String(20), nullable=False)
    age = Column(Integer, nullable=False)
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    orders = relationship("Order", back_populates="customer")
    calls = relationship("Call", back_populates="customer", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Customer(id={self.id}, name={self.full_name}, code={self.customer_code})>"
