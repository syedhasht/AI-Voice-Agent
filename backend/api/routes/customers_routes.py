from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from models import Customer

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("")
def list_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: str = Query(None),
    city: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Customer)
    if search:
        search_pattern = f"%{search}%"
        filters = [
            Customer.full_name.ilike(search_pattern),
            Customer.customer_code.ilike(search_pattern),
            Customer.phone_number.ilike(search_pattern),
            Customer.email.ilike(search_pattern),
            Customer.address.ilike(search_pattern),
            Customer.city.ilike(search_pattern),
            Customer.province.ilike(search_pattern),
            Customer.gender.ilike(search_pattern)
        ]
        try:
            age_val = int(search)
            filters.append(Customer.age == age_val)
        except ValueError:
            pass

        query = query.filter(or_(*filters))
    if city and city != "all":
        query = query.filter(Customer.city == city)

    total = query.count()
    offset = (page - 1) * limit
    items = query.order_by(Customer.id.asc()).offset(offset).limit(limit).all()

    return {
        "items": [
            {
                "id": c.id,
                "customer_code": c.customer_code,
                "full_name": c.full_name,
                "phone_number": c.phone_number,
                "email": c.email,
                "address": c.address,
                "city": c.city,
                "province": c.province,
                "gender": c.gender,
                "age": c.age,
                "created_at": c.created_at.isoformat()
            }
            for c in items
        ],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/{customer_id}")
def get_customer_details(customer_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    total_orders = len(customer.orders)
    approved_orders = sum(
        1 for o in customer.orders 
        if (o.status.value if hasattr(o.status, "value") else o.status) in ("confirmed", "completed")
    )
    approval_rate = round((approved_orders / total_orders) * 100, 1) if total_orders > 0 else 0.0

    return {
        "id": customer.id,
        "customer_code": customer.customer_code,
        "full_name": customer.full_name,
        "phone_number": customer.phone_number,
        "email": customer.email,
        "address": customer.address,
        "city": customer.city,
        "province": customer.province,
        "gender": customer.gender,
        "age": customer.age,
        "created_at": customer.created_at.isoformat(),
        "approval_rate": approval_rate,
        "orders": [
            {
                "id": o.id,
                "displayId": f"ORD-{str(o.id).zfill(3)}",
                "medicine_name": o.medicine_name,
                "quantity": o.quantity,
                "status": o.status.value if hasattr(o.status, "value") else o.status,
                "created_at": o.created_at.isoformat()
            }
            for o in customer.orders
        ],
        "calls": [
            {
                "id": c.id,
                "order_id": c.order_id,
                "order_display_id": f"ORD-{str(c.order_id).zfill(3)}",
                "started_at": c.started_at.isoformat(),
                "duration_seconds": c.duration_seconds,
                "outcome": c.outcome,
                "sentiment": c.sentiment or "Neutral",
                "confidence": c.confidence or 0.0
            }
            for c in customer.calls
        ]
    }

