from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from models import Order, Customer, Medicine, Call, CallAnalytic
from utils.status import OrderStatus

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    # 1. Total counts
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()
    total_medicines = db.query(Medicine).count()

    # 2. Calls today (started_at equals today's date in local server time)
    local_today = datetime.now()
    start_of_today = datetime(local_today.year, local_today.month, local_today.day, 0, 0, 0)
    end_of_today = datetime(local_today.year, local_today.month, local_today.day, 23, 59, 59)
    calls_today = db.query(Call).filter(Call.started_at >= start_of_today, Call.started_at <= end_of_today).count()

    # 3. Order statuses aggregates
    orders_by_status = db.query(Order.status, text("count(*)")).group_by(Order.status).all()
    status_counts = {status.value if hasattr(status, "value") else status: count for status, count in orders_by_status}

    completed_count = status_counts.get("completed", 0)
    rejected_count = status_counts.get("rejected", 0)
    
    # Count of calls needing human agent (Escalated Calls)
    need_human_count = db.query(Call).filter(Call.outcome.ilike("need_human")).count()

    total_calls = db.query(Call).count()
    if total_calls > 0:
        human_escalations = round((need_human_count / total_calls) * 100, 1)
    else:
        human_escalations = 0.0

    if total_orders > 0:
        confirmation_rate = round((completed_count / total_orders) * 100, 1)
        cancellation_rate = round((rejected_count / total_orders) * 100, 1)
    else:
        confirmation_rate = cancellation_rate = 0.0

    # 4. Average call duration
    avg_duration_res = db.query(text("avg(duration_seconds)")).select_from(Call).scalar()
    avg_duration = round(avg_duration_res, 1) if avg_duration_res is not None else 0.0

    # 5. Total Revenue (sum of quantity * unit_price for completed orders)
    revenue_res = db.query(text("sum(orders.quantity * medicines.unit_price)")) \
        .select_from(Order) \
        .join(Medicine, Order.medicine_id == Medicine.id) \
        .filter(Order.status == OrderStatus.COMPLETED) \
        .scalar()
    revenue = round(revenue_res, 2) if revenue_res is not None else 0.0

    return {
        "total_customers": total_customers,
        "total_orders": total_orders,
        "total_medicines": total_medicines,
        "calls_today": calls_today,
        "confirmation_rate": confirmation_rate,
        "cancellation_rate": cancellation_rate,
        "human_escalations": human_escalations,
        "average_call_duration": avg_duration,
        "revenue": revenue,
        "need_human_count": need_human_count
    }


@router.get("/charts")
def get_charts(db: Session = Depends(get_db)):
    # Helper to execute raw sql
    def run_sql(query: str, params=None):
        return db.execute(text(query), params or {}).mappings().all()

    is_pg = db.bind.dialect.name == "postgresql"

    # Define dialect-specific queries
    if is_pg:
        calls_query = "SELECT started_at::date as date, count(*) as count FROM calls GROUP BY started_at::date ORDER BY date DESC LIMIT 30"
        orders_query = "SELECT created_at::date as date, count(*) as count FROM orders GROUP BY created_at::date ORDER BY date DESC LIMIT 30"
        confirmations_query = "SELECT created_at::date as date, count(*) as count FROM orders WHERE status = 'COMPLETED' GROUP BY created_at::date ORDER BY date DESC LIMIT 30"
        revenue_query = (
            "SELECT o.created_at::date as date, sum(o.quantity * m.unit_price) as amount "
            "FROM orders o JOIN medicines m ON o.medicine_id = m.id "
            "WHERE o.status = 'COMPLETED' GROUP BY o.created_at::date ORDER BY date DESC LIMIT 30"
        )
        hour_query = "SELECT to_char(started_at, 'HH24') as hour, count(*) as count FROM calls GROUP BY hour ORDER BY hour ASC"
        growth_query = "SELECT created_at::date as date, count(*) as count FROM customers GROUP BY created_at::date ORDER BY date DESC LIMIT 30"
    else:
        calls_query = "SELECT date(started_at) as date, count(*) as count FROM calls GROUP BY date ORDER BY date DESC LIMIT 30"
        orders_query = "SELECT date(created_at) as date, count(*) as count FROM orders GROUP BY date ORDER BY date DESC LIMIT 30"
        confirmations_query = "SELECT date(created_at) as date, count(*) as count FROM orders WHERE status = 'COMPLETED' GROUP BY date ORDER BY date DESC LIMIT 30"
        revenue_query = (
            "SELECT date(o.created_at) as date, sum(o.quantity * m.unit_price) as amount "
            "FROM orders o JOIN medicines m ON o.medicine_id = m.id "
            "WHERE o.status = 'COMPLETED' GROUP BY date ORDER BY date DESC LIMIT 30"
        )
        hour_query = "SELECT strftime('%H', started_at) as hour, count(*) as count FROM calls GROUP BY hour ORDER BY hour ASC"
        growth_query = "SELECT date(created_at) as date, count(*) as count FROM customers GROUP BY date ORDER BY date DESC LIMIT 30"

    # Helper to convert date to string safely
    def clean_date(val):
        if val is None:
            return ""
        return val.isoformat() if hasattr(val, "isoformat") else str(val)

    # 1. Calls per Day
    calls_res = run_sql(calls_query)
    calls_per_day = [{"date": clean_date(r["date"]), "count": r["count"]} for r in reversed(calls_res)]

    # 2. Orders per Day
    orders_res = run_sql(orders_query)
    orders_per_day = [{"date": clean_date(r["date"]), "count": r["count"]} for r in reversed(orders_res)]

    # 3. Confirmations per Day
    confirmations_res = run_sql(confirmations_query)
    confirmations_per_day = [{"date": clean_date(r["date"]), "count": r["count"]} for r in reversed(confirmations_res)]

    # 4. Order Outcomes
    outcomes_res = run_sql("SELECT status, count(*) as count FROM orders GROUP BY status")
    simplified_mapping = {
        "pending": "Pending Call",
        "queued": "Pending Call",
        "calling": "In Call",
        "in_progress": "In Call",
        "processing": "In Call",
        "simulating": "In Call",
        "elevenlabs_session": "In Call",
        "confirmed": "Confirmed",
        "completed": "Confirmed",
        "modified": "Modified",
        "rejected": "Rejected",
        "need_human": "Need Human"
    }
    grouped_outcomes = {}
    for r in outcomes_res:
        tech_status = r["status"].lower()
        business_label = simplified_mapping.get(tech_status, tech_status.capitalize())
        grouped_outcomes[business_label] = grouped_outcomes.get(business_label, 0) + r["count"]
        
    outcomes = [{"name": name, "value": count} for name, count in grouped_outcomes.items()]

    # 5. Medicine Popularity
    med_res = run_sql(
        "SELECT medicine_name, sum(quantity) as count FROM orders GROUP BY medicine_name ORDER BY count DESC LIMIT 10"
    )
    medicine_popularity = [{"name": r["medicine_name"], "count": r["count"]} for r in med_res]

    # 6. Revenue Trend
    rev_res = run_sql(revenue_query)
    revenue_trend = [{"date": clean_date(r["date"]), "amount": round(r["amount"] or 0.0, 2)} for r in reversed(rev_res)]

    # 7. Calls by Hour
    hour_res = run_sql(hour_query)
    calls_by_hour = [{"hour": f"{int(r['hour'])}:00" if r['hour'] is not None and str(r['hour']).strip().isdigit() else f"{r['hour']}:00", "count": r["count"]} for r in hour_res]

    # 8. Top Cities
    cities_res = run_sql(
        "SELECT city, count(*) as count FROM customers GROUP BY city ORDER BY count DESC LIMIT 10"
    )
    top_cities = [{"city": r["city"], "count": r["count"]} for r in cities_res]

    # 9. Customer Growth
    growth_res = run_sql(growth_query)
    customer_growth = [{"date": clean_date(r["date"]), "count": r["count"]} for r in reversed(growth_res)]

    return {
        "calls_per_day": calls_per_day,
        "orders_per_day": orders_per_day,
        "confirmations_per_day": confirmations_per_day,
        "outcomes": outcomes,
        "medicine_popularity": medicine_popularity,
        "revenue_trend": revenue_trend,
        "calls_by_hour": calls_by_hour,
        "top_cities": top_cities,
        "customer_growth": customer_growth,
    }


@router.get("/recent-orders")
def get_recent_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(10).all()
    return [
        {
            "id": o.id,
            "displayId": f"ORD-{o.id:03d}",
            "customer": o.customer_name,
            "medicine": o.medicine_name,
            "quantity": o.quantity,
            "status": o.status.value if hasattr(o.status, "value") else o.status,
            "created_at": o.created_at.isoformat()
        }
        for o in orders
    ]


@router.get("/recent-calls")
def get_recent_calls(db: Session = Depends(get_db)):
    calls = db.query(Call).order_by(Call.started_at.desc()).limit(10).all()
    return [
        {
            "id": c.id,
            "customer": c.customer.full_name if c.customer else "Unknown",
            "duration": c.duration_seconds,
            "outcome": c.outcome,
            "sentiment": c.sentiment or "Neutral",
            "confidence": c.confidence or 0.0
        }
        for c in calls
    ]
