from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass


@dataclass
class TranscriptionResult:
    text: str
    language: str
    duration_seconds: Optional[float] = None
    confidence_metadata: Optional[dict] = None
    model_used: str = ""
    provider: str = ""


class SpeechToTextProvider(ABC):
    """Abstract interface for STT providers."""

    @abstractmethod
    async def transcribe(
        self,
        audio_data: bytes,
        audio_format: str = "wav",
        language: Optional[str] = None,
        verbose: bool = False,
    ) -> TranscriptionResult:
        """Transcribe audio bytes and return a TranscriptionResult."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True if the provider is reachable and configured."""
        ...
