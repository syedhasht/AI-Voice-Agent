import os
import sys

# Add backend directory to Python path to allow running directly from workspace root
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from database.session import SessionLocal, engine, Base
from models import CallAnalytic, Call, VoiceSession, Order, TimelineEntry, CallLog, Customer, Medicine, AIAgent
from services.seed_service import SeedService
from main import _run_migrations


def main():
    print("Initializing Database Seeding Script...")
    
    # 1. Ensure all tables are recreated with the correct new schemas
    print("Verifying database schema...")
    print("Dropping old tables to update constraints...")
    Base.metadata.drop_all(bind=engine)
    print("Recreating database tables...")
    Base.metadata.create_all(bind=engine)
    _run_migrations()
    
    # 2. Open DB Session
    db = SessionLocal()
    try:
        # 3. Clean existing table contents to start fresh with custom mock data
        print("Clearing existing data from tables (backward-compatible clean)...")
        db.query(CallAnalytic).delete()
        db.query(Call).delete()
        db.query(VoiceSession).delete()
        db.query(Order).delete()
        db.query(TimelineEntry).delete()
        db.query(CallLog).delete()
        db.query(Customer).delete()
        db.query(Medicine).delete()
        db.query(AIAgent).delete()
        db.commit()
        print("Existing data cleared successfully.")

        # 4. Execute the seeder service
        SeedService.seed_all(db)
        print("Database seeding task finished.")
        
    except Exception as e:
        db.rollback()
        print(f"Error during seeding process: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
