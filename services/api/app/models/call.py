import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Integer, Float, Text, ForeignKey, DateTime, Boolean, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from app.db.base import Base, TimestampMixin

# Use JSON with JSONB fallback for postgresql, or standard JSON for SQLite
JSON_TYPE = JSON().with_variant(JSONB(), "postgresql")
UUID_TYPE = Uuid().with_variant(PG_UUID(as_uuid=True), "postgresql")


class Call(Base, TimestampMixin):
    __tablename__ = "calls"

    id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    provider_call_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, unique=True, index=True)
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID_TYPE, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    initiated_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID_TYPE, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    direction: Mapped[str] = mapped_column(String(10), nullable=False)  # inbound | outbound
    call_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="real")  # real | simulated | test
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="initiated")  # initiated | ringing | in_progress | completed | failed | missed | busy | no_answer
    from_number: Mapped[str] = mapped_column(String(30), nullable=False)
    to_number: Mapped[str] = mapped_column(String(30), nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    answered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    recording_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    processing_status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending | processing | completed | failed
    error_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class Transcript(Base, TimestampMixin):
    __tablename__ = "transcripts"

    id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    call_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    provider: Mapped[str] = mapped_column(String(50), nullable=False, default="openrouter")
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    transcript_text: Mapped[str] = mapped_column(Text, nullable=False)
    transcription_status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending | completed | failed
    confidence_metadata: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)


class CallExtraction(Base, TimestampMixin):
    __tablename__ = "call_extractions"

    id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    call_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID_TYPE, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    intent: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    customer_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    callback_number: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="normal")  # low | normal | high | urgent
    requested_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    appointment_requested: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    follow_up_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    assigned_department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    outbound_call_triggered: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    outbound_call_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID_TYPE, nullable=True)
    extracted_json: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)
    validation_status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending | valid | needs_review
    review_status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")  # pending | reviewed | corrected
    reviewed_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID_TYPE, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class CallEvent(Base, TimestampMixin):
    __tablename__ = "call_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    call_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("calls.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    event_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    event_data: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID_TYPE, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    old_values: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)
    new_values: Mapped[Optional[dict]] = mapped_column(JSON_TYPE, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: __import__('datetime').datetime.now(__import__('datetime').timezone.utc))
