from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship

from database.session import Base


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    medicine_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    manufacturer = Column(String(255), nullable=False)
    unit_price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, nullable=False)

    orders = relationship("Order", back_populates="medicine")

    def __repr__(self):
        return f"<Medicine(id={self.id}, name={self.name}, price={self.unit_price})>"
