from typing import Optional, List
from pydantic import BaseModel


class ExtractionResult(BaseModel):
    """Schema used for LLM-based extraction validation."""
    customer_name: Optional[str] = None
    callback_number: Optional[str] = None
    language: str = "en"
    intent: Optional[str] = None
    summary: str
    priority: str = "normal"  # low | normal | high | urgent
    requested_action: Optional[str] = None
    appointment_requested: Optional[str] = None  # ISO datetime string
    follow_up_required: bool = False
    missing_information: List[str] = []
    validation_status: str = "pending"  # pending | valid | needs_review
