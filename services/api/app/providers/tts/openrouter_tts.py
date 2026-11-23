import logging
import httpx
from typing import Optional
from app.providers.tts.base import TextToSpeechProvider, TTSResult
from app.core.config import settings

logger = logging.getLogger(__name__)


import io
import wave

def pcm_to_wav(pcm_bytes: bytes, sample_rate: int = 24000, channels: int = 1, sampwidth: int = 2) -> bytes:
    """Wraps raw 16-bit linear PCM audio bytes into a standard RIFF/WAVE container."""
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sampwidth)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_bytes)
    return buffer.getvalue()


# In-memory LRU audio cache for instant TTS replay on repetitive prompts
_tts_cache: dict[tuple, bytes] = {}


class OpenRouterTTSProvider(TextToSpeechProvider):
    """
    TTS via OpenRouter using Google's Gemini TTS model:
      POST https://openrouter.ai/api/v1/audio/speech
    OpenAI-compatible request format:
      { model: "google/gemini-3.8-flash-lite-tts", input, voice: "Puck", response_format: "pcm" }
    """

    MAX_RETRIES = 3
    TIMEOUT_SECONDS = 60.0

    # Google Gemini studio voice mapping options (e.g., Aoede, Kore, Charon, Fenrir, Zephyr, Puck)
    LANGUAGE_VOICE_MAP = {
        "ar": "Aoede",       # Natural, clear, melodic Arabic pronunciation
        "ar-EG": "Aoede",    # Clear pronunciation for Egyptian and Modern Standard Arabic
        "en": "Zephyr",
    }

    def __init__(self):
        self.api_key = getattr(settings, "OPENROUTER_API_KEY", "") or ""

        self.base_url = settings.OPENROUTER_BASE_URL or "https://openrouter.ai/api/v1"
        
        # Model configured to Google Gemini 3.8 Flash-Lite TTS
        self.model = settings.OPENROUTER_TTS_MODEL or "google/gemini-3.8-flash-lite-tts"
        self.default_voice = settings.TTS_VOICE or "Aoede"
        self.default_format = settings.TTS_RESPONSE_FORMAT or "mp3"

        self._headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.OPENROUTER_SITE_URL,
            "X-Title": settings.OPENROUTER_APP_NAME,
        }

    def _select_voice(self, language: str, voice: Optional[str]) -> str:
        # Available Gemini voices include Zephyr, Puck, Charon, Kore, Fenrir, etc.
        valid_voices = {
            "Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", 
            "Orus", "Aoede", "Callirrhoe", "Autonoe", "Enceladus"
        }
        if voice and voice in valid_voices:
            return voice
        return self.LANGUAGE_VOICE_MAP.get(language, self.default_voice)

    async def synthesize(
        self,
        text: str,
        language: str = "en",
        voice: Optional[str] = None,
        response_format: str = None,
    ) -> TTSResult:
        if not text or not text.strip():
            raise ValueError("text must not be empty")

        # Gemini TTS handles natural Arabic script directly without needing 
        # workaround normalizers like normalize_for_egyptian_tts.
        tts_text = text

        selected_voice = self._select_voice(language, voice)
        requested_format = response_format or self.default_format
        
        # Check in-memory cache for instant zero-latency return
        cache_key = (tts_text.strip(), selected_voice, requested_format)
        if cache_key in _tts_cache:
            cached_audio = _tts_cache[cache_key]
            logger.info(f"TTS cache hit: returning {len(cached_audio)} bytes instantly for '{tts_text[:30]}...'")
            return TTSResult(
                audio_data=cached_audio,
                audio_format=requested_format,
                model_used=self.model,
                provider="openrouter-cache",
            )

        # OpenRouter's Google Gemini TTS only supports response_format="pcm"
        is_gemini = "gemini" in self.model.lower()
        api_format = "pcm" if is_gemini else requested_format

        payload = {
            "model": self.model,
            "input": tts_text,
            "voice": selected_voice,
            "response_format": api_format,
        }

        last_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=self.TIMEOUT_SECONDS) as client:
                    resp = await client.post(
                        f"{self.base_url}/audio/speech",
                        headers=self._headers,
                        json=payload,
                    )
                resp.raise_for_status()
                raw_bytes = resp.content
                if not raw_bytes:
                    raise RuntimeError("TTS returned empty audio response")

                generation_id = resp.headers.get("x-generation-id", "unknown")
                
                # If Gemini returned raw PCM, package into WAV unless raw PCM was explicitly requested
                if is_gemini and requested_format.lower() != "pcm":
                    final_audio = pcm_to_wav(raw_bytes, sample_rate=24000)
                    output_format = "wav"
                else:
                    final_audio = raw_bytes
                    output_format = api_format

                # Store in cache
                if len(_tts_cache) < 200:
                    _tts_cache[cache_key] = final_audio

                logger.info(
                    f"TTS synthesis complete: {len(final_audio)} bytes, format={output_format}, "
                    f"model={self.model}, voice={selected_voice}, gen_id={generation_id}"
                )
                return TTSResult(
                    audio_data=final_audio,
                    audio_format=output_format,
                    model_used=self.model,
                    provider="openrouter",
                )
            except httpx.HTTPStatusError as e:
                status_code = e.response.status_code
                logger.warning(
                    f"TTS HTTP error on attempt {attempt}/{self.MAX_RETRIES}: {status_code} — {e.response.text[:200]}"
                )
                last_error = e
                if status_code in (400, 401, 402, 403, 404):
                    break
            except (httpx.RequestError, httpx.TimeoutException) as e:
                logger.warning(f"TTS request error on attempt {attempt}/{self.MAX_RETRIES}: {e}")
                last_error = e

        raise RuntimeError(
            f"TTS synthesis failed after {self.MAX_RETRIES} attempts: {last_error}"
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