from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class TTSResult:
    audio_data: bytes
    audio_format: str  # mp3 | pcm | wav
    sample_rate: Optional[int] = None
    model_used: str = ""
    provider: str = ""


class TextToSpeechProvider(ABC):
    """Abstract interface for TTS providers."""

    @abstractmethod
    async def synthesize(
        self,
        text: str,
        language: str = "en",
        voice: Optional[str] = None,
        response_format: str = "mp3",
    ) -> TTSResult:
        """Synthesize text to speech and return a TTSResult."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True if the provider is reachable and configured."""
        ...
