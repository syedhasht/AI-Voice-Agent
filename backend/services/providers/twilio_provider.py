"""
Twilio Provider (Placeholder)

Purpose:
    Interface for Twilio telephony services — phone number management,
    SIP trunking, and call routing.

Future Responsibilities:
    - Purchase and configure phone numbers
    - Create SIP trunks for VoIP calling
    - Route inbound calls to the AI agent
    - Send SMS notifications (order confirmations, status updates)
    - Manage call recording settings

Expected Inputs:
    - Phone number, SIP trunk config, message content
    - Account SID, auth token for authentication

Expected Outputs:
    - Twilio call SID, message SID, phone number metadata

Integration Notes:
    - Twilio is the telephony layer; Retell AI uses it under the hood for outbound calls
    - Direct Twilio integration is needed for:
        - Custom SIP trunking
        - SMS notifications
        - Inbound call handling
    - Credentials: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

TODO: Implement actual Twilio integration:
    - Use twilio Python SDK (pip install twilio)
    - Initialize TwilioClient with account_sid and auth_token
    - Implement phone number lookup and validation
"""

from typing import Any, Optional


class TwilioProvider:
    """
    Placeholder for Twilio telephony integration.
    """

    def __init__(self, account_sid: str, auth_token: str, phone_number: str) -> None:
        """
        Initialize the Twilio provider.

        Args:
            account_sid: Twilio Account SID
            auth_token: Twilio Auth Token
            phone_number: Default Twilio phone number (E.164)

        TODO: Initialize Twilio REST client.
        """
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.phone_number = phone_number

    def send_sms(self, to: str, message: str) -> dict[str, Any]:
        """
        Send an SMS message.

        Args:
            to: Recipient phone number (E.164)
            message: SMS body text

        Returns:
            dict with message SID and status

        TODO:
            1. Call client.messages.create(to=..., from_=..., body=...)
            2. Return parsed response
        """
        raise NotImplementedError(
            "TwilioProvider.send_sms is not implemented. "
            "See TODO comments for integration steps."
        )

    def lookup_phone(self, phone_number: str) -> dict[str, Any]:
        """
        Look up phone number metadata (carrier, type, country).

        Args:
            phone_number: Phone number to look up (E.164)

        Returns:
            dict with carrier, phone type, country code

        TODO:
            1. Call client.lookups.phone_numbers(phone_number).fetch()
            2. Return relevant metadata
        """
        raise NotImplementedError(
            "TwilioProvider.lookup_phone is not implemented. "
            "See TODO comments for integration steps."
        )

    def create_sip_trunk(self, trunk_name: str) -> dict[str, Any]:
        """
        Create a new SIP trunk for VoIP calling.

        Args:
            trunk_name: Human-readable trunk name

        Returns:
            dict with trunk SID and configuration

        TODO:
            1. POST to Twilio SIP trunk API
            2. Return trunk metadata
        """
        raise NotImplementedError(
            "TwilioProvider.create_sip_trunk is not implemented. "
            "See TODO comments for integration steps."
        )
