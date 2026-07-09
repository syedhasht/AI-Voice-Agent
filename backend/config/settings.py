"""
Centralized Configuration

Uses Pydantic Settings to load and validate all configuration values.
All environment variables are read from a .env file.

Usage:
    from config import get_settings
    settings = get_settings()
    print(settings.DATABASE_URL)
"""

from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Application ──────────────────────────────────────────────────
    APP_NAME: str = "AI Voice Agent API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # ── Database ─────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./orders.db"

    # ── CORS ─────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:4173",
    ]

    # ── Public URL (for webhooks) ────────────────────────────────────
    PUBLIC_BACKEND_URL: Optional[str] = None

    # ── AI Provider ──────────────────────────────────────────────────
    AI_PROVIDER: str = "mock"
    DEFAULT_LANGUAGE: str = "ur"

    # ── Retell AI ────────────────────────────────────────────────────
    RETELL_API_KEY: Optional[str] = None
    RETELL_AGENT_ID: Optional[str] = None

    # ── Twilio ───────────────────────────────────────────────────────
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    # ── n8n ──────────────────────────────────────────────────────────
    N8N_WEBHOOK_URL: Optional[str] = None

    # ── Soniox (STT) ─────────────────────────────────────────────────
    SONIOX_API_KEY: Optional[str] = None

    # ── ElevenLabs ───────────────────────────────────────────────────
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_AGENT_ID: str = ""

    # ── OpenAI (LLM) ─────────────────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None

    # ── Gemini (LLM for conversation intelligence) ───────────────────
    GEMINI_API_KEY: Optional[str] = None

    # ── AI Assistant Settings (Gemini / Groq) ────────────────────────
    AI_ASSISTANT_PROVIDER: str = "gemini"
    GROQ_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    def validate_provider_settings(self) -> None:
        """
        Validate that required settings are present for the configured AI provider.
        Raises ValueError with a descriptive message if anything is missing.
        """
        provider = self.AI_PROVIDER.lower()

        if provider == "retell":
            missing = []
            if not self.RETELL_API_KEY:
                missing.append("RETELL_API_KEY")
            if not self.RETELL_AGENT_ID:
                missing.append("RETELL_AGENT_ID")
            if missing:
                raise ValueError(
                    f"AI_PROVIDER is set to 'retell' but the following required "
                    f"settings are missing or empty: {', '.join(missing)}. "
                    f"Please add them to your .env file."
                )
        elif provider not in ("mock", "retell"):
            raise ValueError(
                f"Unsupported AI_PROVIDER '{provider}'. Supported values: 'mock', 'retell'."
            )

    def model_post_init(self, __context) -> None:
        """Run validation after all fields are initialized."""
        self.validate_provider_settings()


settings = Settings()


def get_settings() -> Settings:
    return settings
