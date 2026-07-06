"""
Provider Factory

Reads AI_PROVIDER from settings and returns the appropriate provider instance.

Usage:
    from services.provider_factory import get_voice_provider
    provider = get_voice_provider()
    result = provider.run_call(...)

Currently supported:
    - mock  → VoiceService (existing mock)
    - retell → RetellProvider (placeholder)

When AI_PROVIDER=mock, the factory returns the existing mock VoiceService
so the application continues working exactly as before.

When AI_PROVIDER=retell, it returns a RetellProvider placeholder that raises
NotImplementedError on all methods (ready for future implementation).

TODO:
    Add more providers as they become available:
    - get_stt_provider()  → returns SonioxProvider or DeepgramProvider
    - get_tts_provider()  → returns ElevenLabsProvider or OpenAITTSProvider
    - get_llm_provider()  → returns LLMProvider (OpenAI / Anthropic)
"""

from config import get_settings
from services.voice_service import VoiceService
from utils.logger import get_logger

logger = get_logger(__name__)


def get_voice_provider():
    """
    Return the appropriate voice calling provider based on AI_PROVIDER setting.

    Returns:
        VoiceService (mock) or RetellProvider (placeholder)

    The returned provider must implement:
        run_call(customer_name, medicine_name, quantity) -> dict
    """
    settings = get_settings()
    provider_name = settings.AI_PROVIDER.lower()

    if provider_name == "mock":
        logger.info("Using mock VoiceService (AI_PROVIDER=mock)")
        return VoiceService

    if provider_name == "retell":
        from services.providers.retell_provider import RetellProvider

        logger.info("Using RetellProvider (AI_PROVIDER=retell)")
        if not settings.RETELL_API_KEY or not settings.RETELL_AGENT_ID:
            raise ValueError(
                "AI_PROVIDER is set to 'retell' but RETELL_API_KEY or RETELL_AGENT_ID "
                "is missing. Check your .env file."
            )
        return RetellProvider(
            api_key=settings.RETELL_API_KEY,
            agent_id=settings.RETELL_AGENT_ID,
        )

    raise ValueError(
        f"Unsupported AI_PROVIDER '{provider_name}'. "
        f"Supported values: 'mock', 'retell'."
    )


def get_stt_provider():
    """
    Return the appropriate Speech-to-Text provider.

    TODO: Implement when STT integration is ready.
    Currently returns None.
    """
    logger.warning("get_stt_provider() called but no STT provider is configured.")
    return None


def get_tts_provider():
    """
    Return the appropriate Text-to-Speech provider.

    TODO: Implement when TTS integration is ready.
    Currently returns None.
    """
    logger.warning("get_tts_provider() called but no TTS provider is configured.")
    return None


def get_llm_provider():
    """
    Return the appropriate LLM provider.

    TODO: Implement when LLM integration is ready.
    Currently returns None.
    """
    logger.warning("get_llm_provider() called but no LLM provider is configured.")
    return None
