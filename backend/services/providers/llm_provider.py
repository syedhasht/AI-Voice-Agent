"""
LLM Provider (Placeholder)

Purpose:
    Interface for Large Language Model (LLM) integration — analyzes
    conversation transcripts to determine call outcomes and extract
    structured data.

Future Responsibilities:
    - Classify conversation outcome (confirm, modify, reject, need human)
    - Extract modified order details (new quantity, medicine name)
    - Generate natural AI responses during conversation
    - Maintain conversation context and state
    - Detect customer intent, sentiment, and urgency

Expected Inputs:
    - Conversation transcript (list of speaker/text turns)
    - Order context (customer name, medicine, quantity)
    - System prompt / instructions for the AI agent
    - Conversation history for context

Expected Outputs:
    - Structured outcome: status, modified fields, confidence score
    - AI response text for the next turn
    - Detected intents and entities

Integration Notes:
    - Can use OpenAI, Anthropic Claude, or local models (Ollama)
    - The provider should abstract the underlying model completely
    - Requires OPENAI_API_KEY in .env for OpenAI models
    - System prompt engineering will be critical for Urdu/English code-switching

TODO: Implement actual LLM integration:
    - Use openai Python SDK or similar
    - Design system prompts for call outcome classification
    - Implement structured output parsing (JSON mode / function calling)
    - Support both conversation generation and transcript analysis
"""

from typing import Any, Optional


class LLMProvider:
    """
    Placeholder for Large Language Model integration.
    """

    def __init__(self, api_key: str, model: str = "gpt-4o") -> None:
        """
        Initialize the LLM provider.

        Args:
            api_key: API key for the LLM provider
            model: Model identifier (e.g. 'gpt-4o', 'claude-3-opus')

        TODO: Initialize OpenAI/Anthropic client.
        """
        self.api_key = api_key
        self.model = model

    def analyze_transcript(
        self,
        transcript: list[dict[str, str]],
        context: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """
        Analyze a call transcript to determine outcome and extract data.

        Args:
            transcript: List of turns [{"speaker": "...", "text": "..."}]
            context: Optional dict with order info (customer, medicine, quantity)

        Returns:
            dict with:
                - status: str — confirmed, modified, rejected, need_human
                - quantity: int — possibly modified quantity
                - notes: str — summary of the conversation
                - confidence: float — prediction confidence (0-1)

        TODO:
            1. Build system prompt with order context
            2. Call LLM with transcript for analysis
            3. Parse structured JSON response
            4. Validate output fields
        """
        raise NotImplementedError(
            "LLMProvider.analyze_transcript is not implemented. "
            "See TODO comments for integration steps."
        )

    def generate_response(
        self,
        conversation: list[dict[str, str]],
        context: Optional[dict[str, Any]] = None,
    ) -> str:
        """
        Generate the AI agent's next response in the conversation.

        Args:
            conversation: Full conversation history so far
            context: Optional dict with order info

        Returns:
            AI response text string

        TODO:
            1. Build context-aware prompt with conversation history
            2. Call LLM to generate natural response
            3. Ensure response is in correct language (Urdu/English)
            4. Respect maximum response length
        """
        raise NotImplementedError(
            "LLMProvider.generate_response is not implemented. "
            "See TODO comments for integration steps."
        )
