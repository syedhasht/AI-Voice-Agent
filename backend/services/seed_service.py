import random
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from models import Customer, Medicine, Order, Call, VoiceSession, CallAnalytic, AIAgent, TimelineEntry, CallLog
from utils.status import OrderStatus

# Pre-defined mock data lists to ensure everything looks clearly synthetic
FAKE_FIRST_NAMES = [
    "John", "Alice", "Michael", "Emily", "Muhammad", "Sara", "David", "Jane", "Robert", 
    "Zainab", "Ali", "Aisha", "Hamza", "Fatima", "Arthur", "Ford", "Tricia", "Zaphod", 
    "Slartibartfast", "Trillian"
]
FAKE_LAST_NAMES = [
    "Smith", "Brown", "Johnson", "Davis", "Ali", "Khan", "Dent", "Prefect", "McMillan", 
    "Beeblebrox", "Ahmed", "Hassan", "Malik", "Iqbal", "Butt", "Javed", "Siddiqui"
]
FAKE_CITIES = [
    "Springfield", "Fakeville", "Test City", "Sample Town", "Demo City"
]
FAKE_PROVINCES = {
    "Springfield": "Illinois Province",
    "Fakeville": "Mockistan",
    "Test City": "Sandbox Region",
    "Sample Town": "Prototype District",
    "Demo City": "Alpha Province"
}
FAKE_MEDICINE_PREFIXES = [
    "PainRelief", "MediTest", "SampleCure", "DemoCaps", "Mockicillin", 
    "FeverFree", "CoughDrop", "SootheGel", "VitaBoost", "SleepWell"
]
FAKE_MEDICINE_CATEGORIES = [
    "Analgesics", "Antibiotics", "Antivirals", "Vitamins", "Sedatives", 
    "Antihistamines", "Cardiovascular", "Gastrointestinal"
]
FAKE_MANUFACTURERS = [
    "Demo Pharma", "Fake Labs", "TestMed Inc", "Mock Healthcare", "Beta Therapeutics"
]

class SeedService:
    @staticmethod
    def seed_all(db: Session) -> None:
        print("Starting Database Seed...")

        # 1. Seed AIAgents
        print("Seeding AI Agents...")
        agents_data = [
            {"agent_name": "Ghulam Shabbir", "provider": "ElevenLabs", "model": "eleven_flash_v2", "version": "1.2.0", "active": True},
            {"agent_name": "Asma Bibi", "provider": "ElevenLabs", "model": "eleven_flash_v2", "version": "1.1.0", "active": False},
            {"agent_name": "Retell English Male", "provider": "Retell AI", "model": "retell_custom", "version": "2.0.1", "active": False},
            {"agent_name": "Retell English Female", "provider": "Retell AI", "model": "retell_custom", "version": "2.0.0", "active": False},
            {"agent_name": "Standard Bot", "provider": "Local Demo", "model": "local_mock", "version": "1.0.0", "active": False},
        ]
        db.bulk_insert_mappings(AIAgent, agents_data)
        db.commit()

        # 2. Seed Customers (5,000)
        print("Seeding 5,000 Customers...")
        used_phones = set()
        customers_data = []
        for i in range(5000):
            first = random.choice(FAKE_FIRST_NAMES)
            last = random.choice(FAKE_LAST_NAMES)
            name = f"{first} {last}"
            code = f"CUST-{100000 + i}"
            
            # Generate realistic Pakistani mobile numbers like +923014605967, ensuring uniqueness
            while True:
                prefix = random.choice(["300", "301", "302", "312", "321", "333", "345"])
                digits = "".join([str(random.randint(0, 9)) for _ in range(7)])
                phone = f"+92{prefix}{digits}"
                if phone not in used_phones:
                    used_phones.add(phone)
                    break
            
            email = f"{first.lower()}{random.randint(100, 999)}.demo@test.com"
            address = f"House {random.randint(1, 500)}, Street {random.randint(1, 50)}, Fake Block"
            city = random.choice(FAKE_CITIES)
            province = FAKE_PROVINCES.get(city, "Fake Province")
            gender = random.choice(["Male", "Female", "Other"])
            age = random.randint(18, 85)

            created_at = datetime.now() - timedelta(
                days=random.randint(30, 365),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59)
            )

            customers_data.append({
                "id": i + 1,
                "customer_code": code,
                "full_name": name,
                "phone_number": phone,
                "email": email,
                "address": address,
                "city": city,
                "province": province,
                "gender": gender,
                "age": age,
                "created_at": created_at
            })

        for batch in range(0, len(customers_data), 2500):
            db.bulk_insert_mappings(Customer, customers_data[batch:batch+2500])
            db.commit()

        # Fetch customer IDs & basic info to associate in orders
        customers_list = [
            {"id": r.id, "name": r.full_name, "phone": r.phone_number} 
            for r in db.query(Customer.id, Customer.full_name, Customer.phone_number).all()
        ]

        # 3. Seed Medicines (200)
        print("Seeding 200 Medicines...")
        medicines_data = []
        for i in range(200):
            name = f"{random.choice(FAKE_MEDICINE_PREFIXES)}-{random.randint(100, 999)}"
            code = f"MED-{10000 + i}"
            category = random.choice(FAKE_MEDICINE_CATEGORIES)
            manufacturer = random.choice(FAKE_MANUFACTURERS)
            unit_price = round(random.uniform(5.0, 150.0), 2)
            stock_quantity = random.randint(10, 1000)

            medicines_data.append({
                "medicine_code": code,
                "name": name,
                "category": category,
                "manufacturer": manufacturer,
                "unit_price": unit_price,
                "stock_quantity": stock_quantity
            })

        db.bulk_insert_mappings(Medicine, medicines_data)
        db.commit()

        # Fetch medicine IDs & basic info
        medicines_list = [
            {"id": r.id, "name": r.name} 
            for r in db.query(Medicine.id, Medicine.name).all()
        ]

        # 4. Seed Orders (10,000)
        print("Seeding 10,000 Orders...")
        orders_data = []
        order_statuses = list(OrderStatus)
        for i in range(10000):
            cust = random.choice(customers_list)
            med = random.choice(medicines_list)
            qty = random.randint(1, 10)
            status = random.choice(order_statuses)
            notes = f"Mock order notes for {med['name']}"
            created_at = datetime.now() - timedelta(
                days=random.randint(0, 90),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59)
            )

            orders_data.append({
                "customer_name": cust["name"],
                "phone_number": cust["phone"],
                "medicine_name": med["name"],
                "quantity": qty,
                "status": status,
                "notes": notes,
                "customer_id": cust["id"],
                "medicine_id": med["id"],
                "created_at": created_at,
                "updated_at": created_at
            })

        for batch in range(0, len(orders_data), 2500):
            db.bulk_insert_mappings(Order, orders_data[batch:batch+2500])
            db.commit()

        # Fetch order IDs and details
        orders_list = [
            {"id": r.id, "customer_id": r.customer_id, "created_at": r.created_at, "status": r.status} 
            for r in db.query(Order.id, Order.customer_id, Order.created_at, Order.status).all()
        ]

        # 5. Seed Calls (25,000)
        print("Seeding 25,000 Calls...")
        calls_data = []
        for i in range(25000):
            ord_val = random.choice(orders_list)
            started_at = ord_val["created_at"] + timedelta(minutes=random.randint(5, 120))
            duration = random.randint(15, 300)
            ended_at = started_at + timedelta(seconds=duration)
            outcome = ord_val["status"].value
            sentiment = random.choice(["Positive", "Neutral", "Negative"])
            confidence = round(random.uniform(0.65, 0.99), 2)

            calls_data.append({
                "order_id": ord_val["id"],
                "customer_id": ord_val["customer_id"],
                "started_at": started_at,
                "ended_at": ended_at,
                "duration_seconds": duration,
                "outcome": outcome,
                "sentiment": sentiment,
                "confidence": confidence
            })

        for batch in range(0, len(calls_data), 5000):
            db.bulk_insert_mappings(Call, calls_data[batch:batch+5000])
            db.commit()

        # Fetch call details
        calls_list = [
            {"id": r.id, "outcome": r.outcome, "sentiment": r.sentiment, "confidence": r.confidence} 
            for r in db.query(Call.id, Call.outcome, Call.sentiment, Call.confidence).all()
        ]

        # 6. Seed Call Analytics (25,000)
        print("Seeding 25,000 Call Analytics...")
        analytics_data = []
        for call_val in calls_list:
            intent = "Confirm Order" if call_val["outcome"] == "completed" else "Cancel Order" if call_val["outcome"] == "rejected" else "Human Request"
            next_action = "None" if call_val["outcome"] in ("completed", "rejected") else "Callback Patient"
            summary = f"Customer discussed the medicine order. Outcome was {call_val['outcome'].upper()} with {call_val['sentiment'].upper()} sentiment."

            analytics_data.append({
                "call_id": call_val["id"],
                "summary": summary,
                "intent": intent,
                "outcome": call_val["outcome"],
                "sentiment": call_val["sentiment"],
                "confidence": call_val["confidence"],
                "next_action": next_action
            })

        for batch in range(0, len(analytics_data), 5000):
            db.bulk_insert_mappings(CallAnalytic, analytics_data[batch:batch+5000])
            db.commit()

        # 7. Seed Voice Sessions (25,000)
        print("Seeding 25,000 Voice Sessions...")
        voice_sessions_data = []
        for i in range(25000):
            ord_val = random.choice(orders_list)
            started_at = ord_val["created_at"] + timedelta(minutes=random.randint(5, 120))
            duration = random.randint(15, 300)
            ended_at = started_at + timedelta(seconds=duration)

            voice_sessions_data.append({
                "order_id": ord_val["id"],
                "elevenlabs_session_id": f"session_{uuid.uuid4().hex[:12]}",
                "conversation_id": f"conv_{uuid.uuid4().hex[:12]}",
                "started_at": started_at,
                "ended_at": ended_at,
                "status": "completed"
            })

        for batch in range(0, len(voice_sessions_data), 5000):
            db.bulk_insert_mappings(VoiceSession, voice_sessions_data[batch:batch+5000])
            db.commit()

        # 8. Seed existing Timeline Entries & Call Logs
        print("Seeding Timeline Entries & Call Logs...")
        timeline_data = []
        call_log_data = []
        for ord_val in orders_list:
            status_val = ord_val["status"].value
            
            # Every order starts with pending/created
            timeline_data.append({
                "order_id": ord_val["id"],
                "status": "pending",
                "note": "Order created in database",
                "created_at": ord_val["created_at"]
            })
            
            if status_val == "pending":
                continue
                
            elif status_val == "queued":
                timeline_data.append({
                    "order_id": ord_val["id"],
                    "status": "queued",
                    "note": "Order added to dialing queue",
                    "created_at": ord_val["created_at"] + timedelta(minutes=10)
                })
                call_log_data.append({
                    "order_id": ord_val["id"],
                    "step": "queued",
                    "message": "Call session added to Retell outbound queue",
                    "created_at": ord_val["created_at"] + timedelta(minutes=10)
                })
                
            elif status_val == "calling":
                timeline_data.append({
                    "order_id": ord_val["id"],
                    "status": "calling",
                    "note": "AI dialing customer phone number",
                    "created_at": ord_val["created_at"] + timedelta(minutes=15)
                })
                call_log_data.append({
                    "order_id": ord_val["id"],
                    "step": "call_started",
                    "message": "Browser simulation call started",
                    "created_at": ord_val["created_at"] + timedelta(minutes=15)
                })
                
            elif status_val == "in_progress":
                timeline_data.append({
                    "order_id": ord_val["id"],
                    "status": "in_progress",
                    "note": "Active call conversation in progress",
                    "created_at": ord_val["created_at"] + timedelta(minutes=20)
                })
                call_log_data.append({
                    "order_id": ord_val["id"],
                    "step": "call_started",
                    "message": "Browser simulation call started",
                    "created_at": ord_val["created_at"] + timedelta(minutes=15)
                })
                call_log_data.append({
                    "order_id": ord_val["id"],
                    "step": "in_progress",
                    "message": "Active customer dialog state connected",
                    "created_at": ord_val["created_at"] + timedelta(minutes=20)
                })
                
            elif status_val == "processing":
                timeline_data.append({
                    "order_id": ord_val["id"],
                    "status": "processing",
                    "note": "Call finished; parsing transcript metrics",
                    "created_at": ord_val["created_at"] + timedelta(minutes=25)
                })
                call_log_data.append({
                    "order_id": ord_val["id"],
                    "step": "call_started",
                    "message": "Browser simulation call started",
                    "created_at": ord_val["created_at"] + timedelta(minutes=15)
                })
                call_log_data.append({
                    "order_id": ord_val["id"],
                    "step": "call_completed",
                    "message": "Browser simulation call completed. Outcome: PROCESSING",
                    "created_at": ord_val["created_at"] + timedelta(minutes=25)
                })
                
            else: # final statuses: completed, confirmed, modified, rejected, need_human, simulating
                timeline_data.append({
                    "order_id": ord_val["id"],
                    "status": status_val,
                    "note": f"Call completed; order status set to {status_val}",
                    "created_at": ord_val["created_at"] + timedelta(minutes=35)
                })
                
                call_log_data.append({
                    "order_id": ord_val["id"],
                    "step": "call_started",
                    "message": "Browser simulation call started",
                    "created_at": ord_val["created_at"] + timedelta(minutes=30)
                })
                call_log_data.append({
                    "order_id": ord_val["id"],
                    "step": "call_completed",
                    "message": f"Browser simulation call completed. Outcome: {status_val.upper()}",
                    "created_at": ord_val["created_at"] + timedelta(minutes=35)
                })

        for batch in range(0, len(timeline_data), 5000):
            db.bulk_insert_mappings(TimelineEntry, timeline_data[batch:batch+5000])
            db.commit()

        for batch in range(0, len(call_log_data), 5000):
            db.bulk_insert_mappings(CallLog, call_log_data[batch:batch+5000])
            db.commit()

        print("Database Seeding Completed Successfully!")


def run_seed() -> None:
    """Seed the database only if it is empty. Safe to call on every startup."""
    from database.session import SessionLocal
    db = SessionLocal()
    try:
        count = db.query(Customer).count()
        if count == 0:
            print("Empty database detected — running seeder...")
            SeedService.seed_all(db)
        else:
            print(f"Database already has {count} customers — skipping seed.")
    finally:
        db.close()
