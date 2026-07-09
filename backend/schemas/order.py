from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from utils.status import OrderStatus


class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=255)
    phone_number: str = Field(..., min_length=1, max_length=50)
    medicine_name: str = Field(..., min_length=1, max_length=255)
    quantity: int = Field(..., ge=1)
    notes: Optional[str] = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 7:
            raise ValueError("Phone number must be at least 7 characters")
        return cleaned


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone_number: Optional[str] = Field(None, min_length=1, max_length=50)
    medicine_name: Optional[str] = Field(None, min_length=1, max_length=255)
    quantity: Optional[int] = Field(None, ge=1)
    status: Optional[OrderStatus] = None
    notes: Optional[str] = None
    transcript_json: Optional[str] = None
    call_duration_seconds: Optional[int] = None


class TimelineEntryResponse(BaseModel):
    id: int
    status: str
    note: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CallLogResponse(BaseModel):
    id: int
    step: str
    message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    customer_id: Optional[int] = None
    customer_code: Optional[str] = None
    customer_address: Optional[str] = None
    customer_name: str
    phone_number: str
    medicine_name: str
    quantity: int
    status: OrderStatus
    amount: float = 0.0
    notes: Optional[str] = None
    retell_call_id: Optional[str] = None
    transcript_json: Optional[str] = None
    call_duration_seconds: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    timeline: list[TimelineEntryResponse] = []
    call_logs: list[CallLogResponse] = []

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int


class CallLogListResponse(BaseModel):
    items: list[CallLogResponse]
    total: int
