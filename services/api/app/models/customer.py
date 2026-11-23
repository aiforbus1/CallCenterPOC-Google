import uuid
from typing import Optional
from sqlalchemy import String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from app.db.base import Base, TimestampMixin

UUID_TYPE = Uuid().with_variant(PG_UUID(as_uuid=True), "postgresql")


class Customer(Base, TimestampMixin):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE, primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    phone_number: Mapped[str] = mapped_column(String(30), nullable=False, unique=True, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    consent_status: Mapped[str] = mapped_column(String(20), nullable=False, default="unknown")
