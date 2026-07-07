from enum import Enum


class OrderStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    CALLING = "calling"
    IN_PROGRESS = "in_progress"
    PROCESSING = "processing"
    CONFIRMED = "confirmed"
    MODIFIED = "modified"
    REJECTED = "rejected"
    NEED_HUMAN = "need_human"
    SIMULATING = "simulating"
    COMPLETED = "completed"
