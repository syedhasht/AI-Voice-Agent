import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from config import get_settings

settings = get_settings()

db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///"):
    db_path = db_url.replace("sqlite:///", "")
    if not os.path.isabs(db_path):
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        abs_db_path = os.path.abspath(os.path.join(backend_dir, db_path))
        db_url = f"sqlite:///{abs_db_path}"

engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False},
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
