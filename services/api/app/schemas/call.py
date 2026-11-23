from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel


class OutboundCallRequest(BaseModel):
    customer_id: Optional[str] = None
    to_number: Optional[str] = None
    language: str = "en"
    call_mode: str = "real"  # real | simulated


class CallResponse(BaseModel):
    id: str
    provider_call_id: Optional[str] = None
    customer_id: Optional[str] = None
    initiated_by_user_id: Optional[str] = None
    direction: str
    call_mode: str
    status: str
    from_number: str
    to_number: str
    started_at: Optional[datetime] = None
    answered_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    language: str
    recording_reference: Optional[str] = None
    ai_summary: Optional[str] = None
    processing_status: str
    error_code: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CallListResponse(BaseModel):
    items: list[CallResponse]
    total: int
    page: int
    page_size: int


class TranscriptResponse(BaseModel):
    id: str
    call_id: str
    provider: str
    model: str
    language: str
    transcript_text: str
    transcription_status: str
    confidence_metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExtractionResponse(BaseModel):
    id: str
    call_id: str
    customer_id: Optional[str] = None
    intent: Optional[str] = None
    customer_name: Optional[str] = None
    callback_number: Optional[str] = None
    summary: Optional[str] = None
    priority: str
    requested_action: Optional[str] = None
    appointment_requested: Optional[datetime] = None
    follow_up_required: bool
    category: Optional[str] = None
    assigned_department: Optional[str] = None
    department_phone: Optional[str] = None
    outbound_call_triggered: bool = False
    outbound_call_id: Optional[str] = None
    extracted_json: Optional[Dict[str, Any]] = None
    validation_status: str
    review_status: str
    reviewed_by_user_id: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExtractionUpdate(BaseModel):
    intent: Optional[str] = None
    customer_name: Optional[str] = None
    callback_number: Optional[str] = None
    summary: Optional[str] = None
    priority: Optional[str] = None
    requested_action: Optional[str] = None
    category: Optional[str] = None
    assigned_department: Optional[str] = None
    department_phone: Optional[str] = None
    follow_up_required: Optional[bool] = None
    validation_status: Optional[str] = None


class ReviewRequest(BaseModel):
    notes: Optional[str] = None
