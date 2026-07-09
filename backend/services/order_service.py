from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc

from models.order import Order
from models.timeline import TimelineEntry
from models.call_log import CallLog
from schemas.order import OrderCreate, OrderUpdate
from utils.status import OrderStatus


class OrderService:
    @staticmethod
    def create(db: Session, data: OrderCreate) -> Order:
        from models.customer import Customer
        from models.medicine import Medicine
        from sqlalchemy import func

        phone_cleaned = data.phone_number.strip()
        customer_name_cleaned = data.customer_name.strip()
        medicine_name_cleaned = data.medicine_name.strip()

        # 1. Lookup or create customer
        customer = db.query(Customer).filter(Customer.phone_number == phone_cleaned).first()
        if not customer:
            # Generate customer_code (CUST-100000 + max_id + 1)
            max_id = db.query(func.max(Customer.id)).scalar() or 0
            new_code = f"CUST-{100000 + max_id + 1}"
            
            customer = Customer(
                id=max_id + 1,
                customer_code=new_code,
                full_name=customer_name_cleaned,
                phone_number=phone_cleaned,
                email=f"{customer_name_cleaned.lower().replace(' ', '')}{max_id + 1}@test.com",
                city="Springfield",
                province="Illinois Province",
                gender="Other",
                age=40
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)

        # 2. Lookup medicine by name (case-insensitive)
        medicine = db.query(Medicine).filter(Medicine.name.ilike(medicine_name_cleaned)).first()

        order = Order(
            customer_name=customer_name_cleaned,
            phone_number=phone_cleaned,
            medicine_name=medicine_name_cleaned,
            quantity=data.quantity,
            notes=data.notes.strip() if data.notes else None,
            customer_id=customer.id,
            medicine_id=medicine.id if medicine else None
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        # Add initial timeline entry for Order Created
        entry = TimelineEntry(
            order_id=order.id,
            status="pending",
            note="Order registered in the system"
        )
        db.add(entry)
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def get_all(db: Session) -> list[Order]:
        return db.query(Order).order_by(desc(Order.created_at)).all()

    @staticmethod
    def get_paginated(
        db: Session,
        page: int = 1,
        limit: int = 50,
        search: Optional[str] = None,
        status: Optional[str] = None
    ) -> tuple[list[Order], int]:
        query = db.query(Order)
        if status and status != "all":
            from sqlalchemy import or_
            from utils.status import OrderStatus
            
            # Map simplified business query keys to technical OrderStatus enums
            status_map = {
                "pending": [OrderStatus.PENDING, OrderStatus.QUEUED],
                "in_progress": [OrderStatus.CALLING, OrderStatus.IN_PROGRESS, OrderStatus.PROCESSING, OrderStatus.SIMULATING, OrderStatus.ELEVENLABS_SESSION],
                "confirmed": [OrderStatus.CONFIRMED, OrderStatus.COMPLETED],
                "modified": [OrderStatus.MODIFIED],
                "rejected": [OrderStatus.REJECTED],
                "need_human": [OrderStatus.NEED_HUMAN]
            }
            
            target_enums = status_map.get(status.lower())
            if target_enums:
                query = query.filter(Order.status.in_(target_enums))

        if search:
            search_pattern = f"%{search}%"
            order_id_val = None
            search_cleaned = search.strip().lower()
            if search_cleaned.startswith("ord-"):
                try:
                    order_id_val = int(search_cleaned.split("-")[-1])
                except ValueError:
                    pass
            else:
                try:
                    order_id_val = int(search_cleaned)
                except ValueError:
                    pass

            from sqlalchemy import or_
            if order_id_val is not None:
                query = query.filter(
                    or_(
                        Order.id == order_id_val,
                        Order.customer_name.like(search_pattern),
                        Order.medicine_name.like(search_pattern),
                        Order.phone_number.like(search_pattern)
                    )
                )
            else:
                query = query.filter(
                    or_(
                        Order.customer_name.like(search_pattern),
                        Order.medicine_name.like(search_pattern),
                        Order.phone_number.like(search_pattern)
                    )
                )
        total = query.count()
        offset = (page - 1) * limit
        items = query.order_by(desc(Order.created_at)).offset(offset).limit(limit).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, order_id: int) -> Optional[Order]:
        return db.query(Order).filter(Order.id == order_id).first()

    @staticmethod
    def update(db: Session, db_order: Order, data: OrderUpdate) -> Order:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
          if value is not None:
            if isinstance(value, str):
              value = value.strip()
            setattr(db_order, field, value)

        if data.transcript_json is not None:
          duration = data.call_duration_seconds or 0
          
          # Transition transient statuses to COMPLETED on call finish
          if db_order.status in (OrderStatus.SIMULATING, OrderStatus.PENDING, OrderStatus.CALLING, OrderStatus.IN_PROGRESS):
            db_order.status = OrderStatus.COMPLETED
            
            # Add timeline entry
            timeline_entry = TimelineEntry(
              order_id=db_order.id,
              status=OrderStatus.COMPLETED.value,
              note="Call completed; order marked confirmed"
            )
            db.add(timeline_entry)
            
          outcome = db_order.status.value if db_order.status else "COMPLETED"
          msg = f"Browser simulation call completed. Duration: {duration}s. Outcome: {outcome.upper()}"
          log_entry = CallLog(
            order_id=db_order.id,
            step="call_completed",
            message=msg
          )
          db.add(log_entry)

        db.commit()
        db.refresh(db_order)
        return db_order

    @staticmethod
    def delete(db: Session, db_order: Order) -> None:
        db.delete(db_order)
        db.commit()
