import base64
import logging
import httpx
from typing import Optional
from app.providers.stt.base import SpeechToTextProvider, TranscriptionResult
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenRouterSTTProvider(SpeechToTextProvider):
    """
    STT via OpenRouter using:
      POST https://openrouter.ai/api/v1/audio/transcriptions
    Request body (JSON):
      {
        "model": "openai/whisper-large-v3-turbo",
        "input_audio": { "data": "<base64>", "format": "wav" }
      }
    Optional: response_format="verbose_json" for language + segments.
    """

    MAX_RETRIES = 3
    TIMEOUT_SECONDS = 120.0

    def __init__(self, model: Optional[str] = None):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model = model or settings.OPENROUTER_STT_MODEL
        self._headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.OPENROUTER_SITE_URL,
            "X-Title": settings.OPENROUTER_APP_NAME,
        }

    async def transcribe(
        self,
        audio_data: bytes,
        audio_format: str = "wav",
        language: Optional[str] = None,
        verbose: bool = False,
    ) -> TranscriptionResult:
        if not audio_data:
            raise ValueError("audio_data must not be empty")

        audio_b64 = base64.b64encode(audio_data).decode("utf-8")
        payload: dict = {
            "model": self.model,
            "input_audio": {
                "data": audio_b64,
                "format": audio_format,
            },
        }
        if verbose:
            payload["response_format"] = "verbose_json"
        if language:
            payload["language"] = language

        last_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=self.TIMEOUT_SECONDS) as client:
                    resp = await client.post(
                        f"{self.base_url}/audio/transcriptions",
                        headers=self._headers,
                        json=payload,
                    )
                resp.raise_for_status()
                data = resp.json()
                text = data.get("text", "")
                detected_lang = data.get("language", language or "en")
                duration = data.get("duration", None)
                confidence_metadata = None
                if verbose and "segments" in data:
                    confidence_metadata = {
                        "segments": data.get("segments"),
                        "words": data.get("words"),
                        "usage": data.get("usage"),
                    }
                else:
                    confidence_metadata = {"usage": data.get("usage")}
                logger.info(
                    "STT transcription complete",
                    extra={"model": self.model, "chars": len(text), "attempt": attempt},
                )
                return TranscriptionResult(
                    text=text,
                    language=detected_lang,
                    duration_seconds=duration,
                    confidence_metadata=confidence_metadata,
                    model_used=self.model,
                    provider="openrouter",
                )
            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code
                logger.warning(
                    f"STT HTTP error on attempt {attempt}/{self.MAX_RETRIES}: {status_code}"
                )
                last_error = e
                if status_code in (400, 401, 402, 403, 404):
                    # Non-retryable
                    break
                # Retryable: 429, 502, 5xx
            except (httpx.RequestError, httpx.TimeoutException) as e:
                logger.warning(f"STT request error on attempt {attempt}/{self.MAX_RETRIES}: {e}")
                last_error = e

        raise RuntimeError(
            f"STT transcription failed after {self.MAX_RETRIES} attempts: {last_error}"
        )

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{self.base_url}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                return resp.status_code == 200
        except Exception:
            return False
