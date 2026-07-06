"""
Provider Interface Package

Each provider is a self-contained module implementing a specific external service.
Providers follow the same interface pattern:
    - A class with public methods
    - Constructor accepts configuration from Settings
    - Methods raise NotImplementedError with TODO comments
    - No external SDK calls, no business logic

Current providers:
    - RetellProvider  : Outbound AI phone calls
    - TwilioProvider  : Telephony / SIP trunking
    - SonioxProvider  : Speech-to-Text (STT)
    - ElevenLabsProvider : Text-to-Speech (TTS)
    - LLMProvider     : Language model for conversation analysis

Usage:
    from services.providers.retell_provider import RetellProvider
    provider = RetellProvider(api_key="...", agent_id="...")
    result = provider.create_call(...)
"""
