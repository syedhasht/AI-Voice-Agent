from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import get_settings
from database.session import Base, engine
from api.routes import orders_router, twilio_router, agent_tools_router, elevenlabs_webhook_router, dashboard_router, customers_router, calls_router, assistant_router, rag_router
from api.routes.webhooks import router as webhooks_router
from api.routes.demo_voice import router as demo_voice_router
from utils.logger import get_logger
from sqlalchemy import inspect, text

settings = get_settings()
logger = get_logger(__name__)


def _run_migrations():
    """Add columns that may not exist on existing databases."""
    inspector = inspect(engine)
    columns = [c["name"] for c in inspector.get_columns("orders")]
    for col, coltype in [
        ("retell_call_id", "VARCHAR(50)"),
        ("conversation_id", "VARCHAR(255)"),
        ("elevenlabs_session_id", "VARCHAR(255)"),
        ("customer_id", "INTEGER"),
        ("medicine_id", "INTEGER"),
    ]:
        if col not in columns:
            with engine.connect() as conn:
                conn.execute(text(
                    f"ALTER TABLE orders ADD COLUMN {col} {coltype}"
                ))
                conn.commit()
                logger.info("Migration: added %s column to orders", col)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    logger.info("AI_PROVIDER=%s | DATABASE=%s | LOG_LEVEL=%s", settings.AI_PROVIDER, settings.DATABASE_URL, settings.LOG_LEVEL)
    Base.metadata.create_all(bind=engine)
    _run_migrations()
    logger.info("Database tables created / verified")
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred"},
    )


app.include_router(orders_router, prefix="/api")
app.include_router(twilio_router, prefix="/api")
app.include_router(
    webhooks_router,
    prefix="/api/webhooks",
    tags=["webhooks"],
)
app.include_router(agent_tools_router, prefix="/api")
app.include_router(elevenlabs_webhook_router, prefix="/api")
app.include_router(demo_voice_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(customers_router, prefix="/api")
app.include_router(calls_router, prefix="/api")
app.include_router(assistant_router, prefix="/api")
app.include_router(rag_router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}
