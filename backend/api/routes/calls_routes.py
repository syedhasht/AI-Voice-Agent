from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Call, Customer

router = APIRouter(prefix="/calls", tags=["Calls"])


@router.get("")
def list_calls(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=5000),
    outcome: str = Query(None),
    sentiment: str = Query(None),
    search: str = Query(None),
    date: str = Query(None),
    db: Session = Depends(get_db)
):
    from sqlalchemy.orm import joinedload
    query_obj = db.query(Call).options(joinedload(Call.customer)).join(Customer, Call.customer_id == Customer.id)

    if outcome and outcome != "all":
        query_obj = query_obj.filter(Call.outcome == outcome)

    if sentiment and sentiment != "all":
        query_obj = query_obj.filter(Call.sentiment == sentiment)

    if search:
        search_cleaned = search.strip().lower()
        call_id_val = None
        if search_cleaned.startswith("call-"):
            try:
                call_id_val = int(search_cleaned.split("-")[-1])
            except ValueError:
                pass
        else:
            try:
                call_id_val = int(search_cleaned)
            except ValueError:
                pass

        if call_id_val is not None:
            query_obj = query_obj.filter(Call.id == call_id_val)
        else:
            query_obj = query_obj.filter(Customer.full_name.ilike(f"%{search}%"))

    if date:
        from sqlalchemy import func
        query_obj = query_obj.filter(func.date(Call.started_at) == date)

    total = query_obj.count()
    offset = (page - 1) * limit
    items = query_obj.order_by(Call.started_at.desc()).offset(offset).limit(limit).all()

    return {
        "items": [
            {
                "id": c.id,
                "order_id": c.order_id,
                "customer_name": c.customer.full_name if c.customer else "Unknown",
                "started_at": c.started_at.isoformat(),
                "ended_at": c.ended_at.isoformat(),
                "duration_seconds": c.duration_seconds,
                "outcome": c.outcome,
                "sentiment": c.sentiment or "Neutral",
                "confidence": c.confidence or 0.0
            }
            for c in items
        ],
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/{call_id}")
def get_call_details(call_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    import json
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    order = call.order
    transcript = []
    if order and order.transcript_json:
        try:
            transcript = json.loads(order.transcript_json)
        except Exception:
            pass

    call_logs = []
    if order and order.call_logs:
        call_logs = [
            {
                "id": log.id,
                "step": log.step,
                "message": log.message,
                "created_at": log.created_at.isoformat()
            }
            for log in order.call_logs
        ]

    return {
        "id": call.id,
        "order_id": call.order_id,
        "customer_name": call.customer.full_name if call.customer else "Unknown",
        "phone_number": call.customer.phone_number if call.customer else "Unknown",
        "started_at": call.started_at.isoformat(),
        "ended_at": call.ended_at.isoformat(),
        "duration_seconds": call.duration_seconds,
        "outcome": call.outcome,
        "sentiment": call.sentiment or "Neutral",
        "confidence": call.confidence or 0.0,
        "transcript": transcript,
        "call_logs": call_logs
    }

