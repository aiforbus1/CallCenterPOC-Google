import os
from typing import List, Optional
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from pydantic import field_validator

# Safely load any .env files from parent directories with override=True so updated .env takes precedence
for _parent in Path(__file__).resolve().parents:
    _env_candidate = _parent / ".env"
    if _env_candidate.is_file():
        load_dotenv(dotenv_path=_env_candidate, override=True)
if Path("/app/.env").is_file():
    load_dotenv(dotenv_path="/app/.env", override=True)



class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000,http://mohsen-desktop:3000,http://mohsen-desktop:8000,http://mohsen-desktop.taile395e1.ts.net:3000,http://mohsen-desktop.taile395e1.ts.net:8000,http://100.109.247.54:3000,http://100.109.247.54:8000"

    # Database
    DATABASE_URL: str
    DATABASE_SYNC_URL: Optional[str] = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str]) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
                v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("DATABASE_SYNC_URL", mode="before")
    @classmethod
    def assemble_sync_db_connection(cls, v: Optional[str], info) -> str:
        if isinstance(v, str) and v:
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql://", 1)
            if v.startswith("postgresql+asyncpg://"):
                return v.replace("postgresql+asyncpg://", "postgresql://", 1)
            return v
        return "postgresql://callcenter:callcenter@localhost:5432/callcenterdb"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OpenRouter & Gemini
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_STT_MODEL: str = "openai/whisper-large-v3"
    OPENROUTER_TTS_MODEL: str = "google/gemini-3.8-flash-lite-tts"
    OPENROUTER_CHAT_MODEL: str = "google/gemma-4-26b-a4b-it"
    OPENROUTER_STT_CORRECTOR_MODEL: str = "google/gemma-4-26b-a4b-it"
    OPENROUTER_SITE_URL: str = "http://localhost:3000"
    OPENROUTER_APP_NAME: str = "Egyptian Police 122 Emergency Dispatch AI"
    GEMINI_API_KEY: Optional[str] = None

    # TTS
    TTS_VOICE: str = "Aoede"
    TTS_RESPONSE_FORMAT: str = "wav"


    # Twilio
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    TWILIO_API_KEY_SID: Optional[str] = None
    TWILIO_API_KEY_SECRET: Optional[str] = None

    # Public URLs
    PUBLIC_API_BASE_URL: str = "http://localhost:8000"
    PUBLIC_WEB_BASE_URL: str = "http://localhost:3000"
    PUBLIC_MEDIA_WEBSOCKET_URL: str = "ws://localhost:8000"

    # Telephony
    TELEPHONY_PROVIDER: str = "simulated"

    # Recording
    RECORDING_ENABLED: bool = True
    RECORDING_RETENTION_DAYS: int = 30

    # Outbound restrictions
    ALLOWED_OUTBOUND_DESTINATIONS: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_outbound_list(self) -> List[str]:
        if not self.ALLOWED_OUTBOUND_DESTINATIONS:
            return []
        return [n.strip() for n in self.ALLOWED_OUTBOUND_DESTINATIONS.split(",") if n.strip()]

    @property
    def twilio_configured(self) -> bool:
        return bool(
            self.TWILIO_ACCOUNT_SID
            and self.TWILIO_AUTH_TOKEN
            and self.TWILIO_PHONE_NUMBER
        )

    class Config:
        env_file = ".env"
        extra = "ignore"


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
