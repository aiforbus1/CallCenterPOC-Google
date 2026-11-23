import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Text, Boolean, JSON, Uuid, Float
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from app.db.base import Base, TimestampMixin

# Use JSON with JSONB fallback for postgresql, or standard JSON for SQLite
JSON_TYPE = JSON().with_variant(JSONB(), "postgresql")
UUID_TYPE = Uuid().with_variant(PG_UUID(as_uuid=True), "postgresql")


class AgentSetting(Base, TimestampMixin):
    __tablename__ = "agent_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, primary_key=True, default=uuid.uuid4)
    key: Mapped[str] = mapped_column(String(50), unique=True, default="default", index=True)
    arabic_greeting: Mapped[str] = mapped_column(Text, nullable=False)
    acknowledgment_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="تمام يا فندم، اطمن.")
    clarification_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="معلش يا فندم، الصوت مكنش واضح عندي خالص. ممكن تعيد عليا تاني بعد إذنك؟")
    hangup_reassurance_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="تحت أمرك يا فندم، اطمن الدورية في طريقها لموقع البلاغ فوراً، وخليك في مكان آمن.")
    closing_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Configurable English call sentences
    english_greeting: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="Egyptian Police Emergency Hotline 122. Please state your emergency?")
    english_acknowledgment_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="Understood, stay calm.")
    english_clarification_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="I am sorry, the audio was not clear. Could you please repeat?")
    english_hangup_reassurance_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="You are in good hands. The police patrol is en route immediately. Stay safe!")
    english_closing_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="All your emergency report details have been dispatched to the nearest police patrol unit. Stay in a safe place, emergency services are en route!")

    questions: Mapped[List[Dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=False, default=list)
    tts_voice: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="Aoede")
    vad_silence_timeout_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=1.8)
    chat_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="google/gemma-4-26b-a4b-it")
    stt_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="openai/whisper-large-v3")
    departments: Mapped[List[Dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=False, default=list)
    categories: Mapped[List[Dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=False, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
