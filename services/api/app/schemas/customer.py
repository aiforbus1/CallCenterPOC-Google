from typing import Optional
from pydantic import BaseModel, field_validator
import phonenumbers


def normalize_phone(v: str) -> str:
    if not v:
        return v
    try:
        parsed = phonenumbers.parse(v, None)
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        raise ValueError(f"Invalid phone number: {v}")
    except phonenumbers.phonenumberutil.NumberParseException:
        # Try with Egypt as default country
        try:
            parsed = phonenumbers.parse(v, "EG")
            if phonenumbers.is_valid_number(parsed):
                return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except Exception:
            pass
        raise ValueError(f"Cannot parse phone number: {v}")


class CustomerCreate(BaseModel):
    full_name: str
    phone_number: str
    email: Optional[str] = None
    preferred_language: str = "en"
    notes: Optional[str] = None
    consent_status: str = "unknown"

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v):
        return normalize_phone(v)

    @field_validator("preferred_language")
    @classmethod
    def validate_language(cls, v):
        if v not in ("en", "ar", "ar-EG"):
            raise ValueError("preferred_language must be 'en', 'ar', or 'ar-EG'")
        return v

    @field_validator("consent_status")
    @classmethod
    def validate_consent(cls, v):
        if v not in ("unknown", "granted", "revoked"):
            raise ValueError("consent_status must be 'unknown', 'granted', or 'revoked'")
        return v


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    preferred_language: Optional[str] = None
    notes: Optional[str] = None
    consent_status: Optional[str] = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v):
        if v is None:
            return v
        return normalize_phone(v)


class CustomerResponse(BaseModel):
    id: str
    full_name: str
    phone_number: str
    email: Optional[str] = None
    preferred_language: str
    notes: Optional[str] = None
    consent_status: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int
    page: int
    page_size: int
