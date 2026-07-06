"""
Mock Voice Service

Simulates a realistic AI-powered outbound calling system with full conversation
generation, transcript creation, and decision logic.

Current: Generates mock transcripts and outcomes.
Future: Replace with Retell AI + LLM + STT + TTS.

TODO: Replace mock with real AI services:
    - VoiceService → Retell AI outbound call API
    - Transcript → STT (Deepgram/Whisper) real-time transcription
    - Decision → LLM analysis of conversation
    - Responses → TTS (ElevenLabs) generated speech
"""

import random
import json
from typing import Optional

from utils.status import OrderStatus


class VoiceService:
    """
    Simulates an AI voice agent that calls a customer to confirm a medication order.

    Produces:
        - status: final outcome
        - notes: human-readable summary
        - quantity: possibly modified
        - transcript: list of dialogue turns (AI + Customer)
        - duration_seconds: simulated call duration
    """

    OUTCOMES = [
        OrderStatus.CONFIRMED,
        OrderStatus.MODIFIED,
        OrderStatus.REJECTED,
        OrderStatus.NEED_HUMAN,
    ]
    WEIGHTS = [50, 20, 20, 10]

    # ── Conversation templates for each outcome ──────────────────────

    @staticmethod
    def _greeting() -> list[str]:
        return [
            "Assalam-o-Alaikum, main AI Voice Agent bol rahi hoon.",
            "Kya main [Customer Name] se baat kar rahi hoon?",
            "Aapke pharmacy order ke confirmation ke liye call kar rahi hoon.",
        ]

    @staticmethod
    def _order_summary(medicine: str, qty: int) -> list[str]:
        return [
            f"Aapne {medicine} {qty} ki tablet order ki thi.",
            "Kya main ye order confirm kar doon?",
        ]

    @staticmethod
    def _farewell() -> list[str]:
        return [
            "Shukriya, aapka din achha guzre. Allah Hafiz.",
        ]

    @staticmethod
    def run_call(customer_name: str, medicine_name: str, quantity: int) -> dict:
        """
        Simulate a full AI voice call.

        Returns a dict with status, notes, quantity, transcript, duration_seconds.

        TODO: Replace with Retell AI API call:
            1. Call retell.create_phone_call(customer_number, agent_config)
            2. Wait for webhook call.completed
            3. Parse LLM result from transcript
            4. Return structured outcome
        """
        outcome = random.choices(VoiceService.OUTCOMES, weights=VoiceService.WEIGHTS, k=1)[0]
        transcript = []
        duration_seconds = random.randint(45, 180)

        # Build conversation
        for line in VoiceService._greeting():
            transcript.append({"speaker": "AI", "text": line.replace("[Customer Name]", customer_name)})

        for line in VoiceService._order_summary(medicine_name, quantity):
            transcript.append({"speaker": "AI", "text": line})

        result = {
            "status": outcome,
            "quantity": quantity,
            "notes": "",
            "transcript": transcript,
            "duration_seconds": duration_seconds,
        }

        if outcome == OrderStatus.CONFIRMED:
            VoiceService._build_confirmed(result, customer_name, medicine_name, quantity)
        elif outcome == OrderStatus.MODIFIED:
            VoiceService._build_modified(result, customer_name, medicine_name, quantity)
        elif outcome == OrderStatus.REJECTED:
            VoiceService._build_rejected(result, customer_name, medicine_name)
        elif outcome == OrderStatus.NEED_HUMAN:
            VoiceService._build_need_human(result, customer_name, medicine_name)

        # Farewell
        for line in VoiceService._farewell():
            result["transcript"].append({"speaker": "AI", "text": line})

        return result

    @staticmethod
    def _build_confirmed(result: dict, customer: str, medicine: str, qty: int) -> None:
        result["notes"] = f"Customer confirmed the order for {medicine} ({qty} units)."
        result["transcript"].extend([
            {"speaker": "Customer", "text": "Haan ji, confirm hai. Order theek hai."},
            {"speaker": "Customer", "text": f"Ji, {qty} tablets sahi hain."},
        ])

    @staticmethod
    def _build_modified(result: dict, customer: str, medicine: str, qty: int) -> None:
        new_qty = VoiceService._generate_modified_quantity(qty)
        result["quantity"] = new_qty
        change = "increase" if new_qty > qty else "reduction"
        result["notes"] = f"Customer requested {change} from {qty} to {new_qty} due to availability."
        result["transcript"].extend([
            {"speaker": "Customer", "text": f"Ji, lekin mujhe sirf {new_qty} chahiye."},
            {"speaker": "Customer", "text": "Quantity kam kar do, please."},
            {"speaker": "AI", "text": f"Theek hai, main quantity {qty} se {new_qty} kar rahi hoon."},
        ])

    @staticmethod
    def _build_rejected(result: dict, customer: str, medicine: str) -> None:
        reasons = [
            "Customer no longer needs this medication.",
            "Customer found a better price elsewhere.",
            "Customer wants to consult their doctor first.",
            "Customer is not interested at this time.",
            "No answer after multiple ringing attempts.",
        ]
        result["notes"] = random.choice(reasons)
        result["transcript"].extend([
            {"speaker": "Customer", "text": "Nahi, mujhe ab nahi chahiye."},
            {"speaker": "Customer", "text": "Please cancel ye order."},
        ])

    @staticmethod
    def _build_need_human(result: dict, customer: str, medicine: str) -> None:
        reasons = [
            "Customer has complex insurance questions.",
            "Customer requested to speak with a pharmacist.",
            "Customer has allergy concerns requiring expert advice.",
            "Customer wants to verify drug interactions.",
        ]
        result["notes"] = random.choice(reasons)
        result["transcript"].extend([
            {"speaker": "Customer", "text": "Mujhe kuch sawaal hain, kya aap madad kar sakte hain?"},
            {"speaker": "Customer", "text": "Mujhe ek pharmacist se baat karni hai."},
            {"speaker": "AI", "text": "Koi baat nahi, main aapko hamare human agent se connect kar rahi hoon."},
        ])

    @staticmethod
    def _generate_modified_quantity(original: int) -> int:
        if original <= 15:
            return original + random.randint(15, 60)
        elif original <= 30:
            return random.choice([15, 60, 90])
        else:
            return random.choice([15, 30, 60])
