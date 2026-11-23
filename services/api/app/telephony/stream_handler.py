"""
Twilio Media Stream WebSocket handler.

Twilio sends audio to this endpoint as base64-encoded mu-law (PCMU) 8kHz audio
in JSON messages over WebSocket.

Architecture:
  1. Twilio WebSocket -> this handler
  2. Accumulate audio chunks until silence / end-of-utterance
  3. Convert mu-law -> WAV
  4. Send to live STT (or Google Gemini Live in future)
  5. Send text to LLM
  6. TTS synthesize response
  7. Convert TTS audio to mu-law 8kHz
  8. Send back via Twilio WebSocket as base64 media chunks

For the POC, we use a simple sequential turn-based pipeline.
Real-time streaming STT (e.g. Deepgram) can be plugged in as the
SpeechToTextProvider for lower latency in production.
"""
import asyncio
import audioop
import base64
import json
import logging
import io
import struct
from datetime import datetime, timezone
from typing import Optional
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.call import Call, CallEvent
from app.providers.stt.openrouter_stt import OpenRouterSTTProvider
from app.providers.tts.openrouter_tts import OpenRouterTTSProvider
from app.providers.conversation.openrouter_chat import OpenRouterChatProvider
from app.providers.conversation.base import ConversationMessage
from app.core.config import settings
from app.services.agent_settings_service import get_cached_agent_settings

logger = logging.getLogger(__name__)


# Agent system prompt
AGENT_SYSTEM_PROMPT = """أنت ممثل خدمة عملاء محترف لمركز اتصالات مصري.
- اتكلم باللهجة المصرية العامية 100% (زي: يا فندم، من عينيا، حاضر، تحت أمرك، اطمن خالص).
- ممنوع التحدث بالفصحى الجافة.
- ردودك تكون قصيرة ومباشرة ومناسبة للصوت (أقل من 40 كلمة).
- لو العميل اتكلم إنجليزي، رد عليه إنجليزي بنفس الأسلوب اللطيف."""

GREETING_EN = "Hello! This is your AI customer assistant. How can I help you today?"
GREETING_AR = "يا أهلاً وسهلاً بحضرتك يا فندم! معاك خدمة العملاء، تؤمرني بإيه النهاردة؟"
FALLBACK_EN = "I'm sorry, I couldn't hear that clearly. Could you please repeat?"
FALLBACK_AR = "معلش يا فندم، الصوت مكنش واضح عندي خالص. ممكن تعيد عليا تاني بعد إذنك؟"

SILENCE_TIMEOUT_SECONDS = 1.8   # Wait 1.8s of silence after speech before triggering turn
SILENCE_THRESHOLD_RMS = 500     # PCM 16-bit energy threshold separating speech from background noise
MAX_SPEECH_BUFFER_BYTES = 960000 # Safety cap: ~120 seconds of continuous speech at 8kHz mu-law (supports up to 60s VAD)
MAX_CALL_DURATION_SECONDS = 600  # 10 minutes
MIN_AUDIO_BYTES = 3200          # ~400ms of mu-law audio at 8kHz


def mulaw_to_wav(mulaw_bytes: bytes, sample_rate: int = 8000) -> bytes:
    """Convert mu-law encoded audio to WAV format."""
    import audioop
    # Decode mu-law to linear PCM
    pcm_bytes = audioop.ulaw2lin(mulaw_bytes, 2)  # 2 = 16-bit samples
    # Build WAV header
    num_samples = len(pcm_bytes) // 2
    wav_buf = io.BytesIO()
    # RIFF header
    wav_buf.write(b'RIFF')
    wav_buf.write(struct.pack('<I', 36 + len(pcm_bytes)))  # file size - 8
    wav_buf.write(b'WAVE')
    # fmt chunk
    wav_buf.write(b'fmt ')
    wav_buf.write(struct.pack('<I', 16))  # chunk size
    wav_buf.write(struct.pack('<H', 1))   # PCM format
    wav_buf.write(struct.pack('<H', 1))   # mono
    wav_buf.write(struct.pack('<I', sample_rate))
    wav_buf.write(struct.pack('<I', sample_rate * 2))  # byte rate
    wav_buf.write(struct.pack('<H', 2))   # block align
    wav_buf.write(struct.pack('<H', 16))  # bits per sample
    # data chunk
    wav_buf.write(b'data')
    wav_buf.write(struct.pack('<I', len(pcm_bytes)))
    wav_buf.write(pcm_bytes)
    return wav_buf.getvalue()


def audio_to_mulaw(audio_bytes: bytes, audio_format: str = "wav") -> bytes:
    """
    Convert audio (WAV, MP3, etc.) to mu-law 8kHz for Twilio.
    Uses pydub + audioop.
    """
    import audioop
    from pydub import AudioSegment
    try:
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format=audio_format)
    except Exception:
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
    # Resample to 8kHz mono
    audio = audio.set_frame_rate(8000).set_channels(1).set_sample_width(2)
    pcm_bytes = audio.raw_data
    # Convert PCM to mu-law
    mulaw_bytes = audioop.lin2ulaw(pcm_bytes, 2)
    return mulaw_bytes


# Alias for backward compatibility
mp3_to_mulaw = audio_to_mulaw


class ConversationSession:
    """Maintains state for a single call conversation."""

    def __init__(self, call_id: str, language: str = "en"):
        self.call_id = call_id
        self.language = language
        self.messages: list[ConversationMessage] = [
            ConversationMessage(role="system", content=AGENT_SYSTEM_PROMPT)
        ]
        self.turn_count = 0
        self.started_at = datetime.now(timezone.utc)

    def add_user_turn(self, text: str):
        self.messages.append(ConversationMessage(role="user", content=text))
        self.turn_count += 1

    def add_assistant_turn(self, text: str):
        self.messages.append(ConversationMessage(role="assistant", content=text))

    def is_expired(self) -> bool:
        elapsed = (datetime.now(timezone.utc) - self.started_at).total_seconds()
        return elapsed > MAX_CALL_DURATION_SECONDS


async def handle_twilio_stream(websocket: WebSocket, call_id: str):
    """
    Main WebSocket handler for Twilio Media Streams.
    """
    await websocket.accept()
    logger.info(f"WebSocket stream connected for call {call_id}")

    agent_settings = get_cached_agent_settings()
    stt_model = agent_settings.get("stt_model")
    chat_model = agent_settings.get("chat_model")
    vad_timeout = agent_settings.get("vad_silence_timeout_seconds") or SILENCE_TIMEOUT_SECONDS

    stt = OpenRouterSTTProvider(model=stt_model)
    tts = OpenRouterTTSProvider()
    chat = OpenRouterChatProvider(model=chat_model)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Call).where(Call.id == call_id))
        call = result.scalar_one_or_none()
        language = call.language if call else "en"
        if call:
            call.status = "in_progress"
            call.answered_at = datetime.now(timezone.utc)
            await db.flush()
            await db.commit()

    session = ConversationSession(call_id=call_id, language=language)
    stream_sid: Optional[str] = None
    audio_buffer = bytearray()
    pre_speech_buffer = bytearray()
    has_speech = False
    silence_chunk_count = 0
    silence_chunks_needed = int(vad_timeout / 0.02)  # 20ms chunks (160 bytes each) based on configured VAD
    last_audio_time = asyncio.get_event_loop().time()

    async def send_audio_to_caller(audio_bytes: bytes, audio_format: str = "mp3"):
        """Convert TTS audio to mu-law and stream to Twilio."""
        nonlocal stream_sid
        if not stream_sid:
            logger.warning("No stream SID, cannot send audio")
            return
        try:
            mulaw_audio = mp3_to_mulaw(audio_bytes)
            # Twilio expects 160-byte chunks (20ms each at 8kHz)
            chunk_size = 160
            for i in range(0, len(mulaw_audio), chunk_size):
                chunk = mulaw_audio[i:i + chunk_size]
                encoded = base64.b64encode(chunk).decode("utf-8")
                msg = json.dumps({
                    "event": "media",
                    "streamSid": stream_sid,
                    "media": {"payload": encoded}
                })
                await websocket.send_text(msg)
                await asyncio.sleep(0.02)  # Pace chunks at 20ms intervals
        except Exception as e:
            logger.error(f"Error sending audio to caller: {e}")

    async def process_accumulated_audio():
        """Process buffered audio through STT -> LLM -> TTS pipeline."""
        nonlocal audio_buffer, has_speech, silence_chunk_count
        has_speech = False
        silence_chunk_count = 0
        if len(audio_buffer) < MIN_AUDIO_BYTES:
            audio_buffer = bytearray()
            return

        audio_data = bytes(audio_buffer)
        audio_buffer = bytearray()

        try:
            # STT: mu-law -> WAV -> transcription
            wav_data = mulaw_to_wav(audio_data)
            stt_result = await stt.transcribe(
                audio_data=wav_data,
                audio_format="wav",
                language=session.language,
            )
            text = stt_result.text.strip()
            logger.info(f"STT [{call_id}]: '{text}' (lang={stt_result.language})")

            if not text:
                # No speech detected
                return

            session.add_user_turn(text)
            # Detect language from STT
            if stt_result.language.startswith("ar"):
                session.language = "ar-EG"

            # LLM: generate response
            chat_response = await chat.chat(session.messages, max_tokens=150, temperature=0.7)
            response_text = chat_response.text.strip()
            logger.info(f"LLM [{call_id}]: '{response_text[:80]}'")
            session.add_assistant_turn(response_text)

            # TTS: synthesize response
            tts_result = await tts.synthesize(
                text=response_text,
                language=session.language,
            )

            # Stream audio to caller
            await send_audio_to_caller(tts_result.audio_data, tts_result.audio_format)

        except Exception as e:
            logger.error(f"Pipeline error [{call_id}]: {e}")
            # Send fallback message
            try:
                fallback = FALLBACK_AR if session.language.startswith("ar") else FALLBACK_EN
                tts_result = await tts.synthesize(fallback, language=session.language)
                await send_audio_to_caller(tts_result.audio_data, tts_result.audio_format)
            except Exception:
                pass

    async def send_greeting():
        """Send the initial AI greeting."""
        try:
            cached_settings = get_cached_agent_settings()
            ar_greeting = cached_settings.get("arabic_greeting") or GREETING_AR
            questions = cached_settings.get("questions") or []

            if language.startswith("ar"):
                if questions and len(questions) > 0:
                    first_q = questions[0].get("text", "").strip()
                    greeting = f"{ar_greeting.strip()} {first_q}" if first_q else ar_greeting
                else:
                    greeting = ar_greeting
            else:
                greeting = GREETING_EN

            session.add_assistant_turn(greeting)
            tts_result = await tts.synthesize(greeting, language=language)
            await send_audio_to_caller(tts_result.audio_data, tts_result.audio_format)
        except Exception as e:
            logger.error(f"Error sending greeting: {e}")


    greeting_sent = False

    try:
        async for raw_message in websocket.iter_text():
            if session.is_expired():
                logger.info(f"Call {call_id} reached max duration, ending")
                break

            try:
                message = json.loads(raw_message)
            except json.JSONDecodeError:
                continue

            event_type = message.get("event", "")

            if event_type == "connected":
                logger.info(f"Twilio stream connected: call={call_id}")

            elif event_type == "start":
                stream_sid = message.get("streamSid")
                logger.info(f"Stream started: SID={stream_sid}")
                if not greeting_sent:
                    greeting_sent = True
                    await send_greeting()

            elif event_type == "media":
                payload = message.get("media", {}).get("payload", "")
                if payload:
                    chunk = base64.b64decode(payload)
                    if not chunk:
                        continue
                    last_audio_time = asyncio.get_event_loop().time()

                    # Compute chunk audio energy via PCM 16-bit RMS
                    try:
                        pcm_chunk = audioop.ulaw2lin(chunk, 2)
                        rms = audioop.rms(pcm_chunk, 2)
                    except Exception:
                        rms = 0

                    if rms > SILENCE_THRESHOLD_RMS:
                        # User is actively speaking
                        if not has_speech:
                            has_speech = True
                            # Prepend rolling pre-speech buffer (~200ms) to preserve onset consonants
                            audio_buffer.extend(pre_speech_buffer)
                            pre_speech_buffer.clear()
                        audio_buffer.extend(chunk)
                        silence_chunk_count = 0

                        # Safety cap: process turn if speaking continuously for 20s without pause
                        if len(audio_buffer) >= MAX_SPEECH_BUFFER_BYTES:
                            await process_accumulated_audio()
                    elif has_speech:
                        # User was speaking, now paused/silent
                        audio_buffer.extend(chunk)
                        silence_chunk_count += 1

                        # Turn completion: user paused for SILENCE_TIMEOUT_SECONDS (1.8s)
                        if silence_chunk_count >= silence_chunks_needed:
                            await process_accumulated_audio()
                    else:
                        # Background silence before user starts speaking: maintain rolling ~200ms pre-buffer
                        pre_speech_buffer.extend(chunk)
                        if len(pre_speech_buffer) > 1600:
                            pre_speech_buffer = pre_speech_buffer[-1600:]

            elif event_type == "stop":
                logger.info(f"Stream stopped for call {call_id}")
                # Process any remaining audio
                if len(audio_buffer) >= MIN_AUDIO_BYTES:
                    await process_accumulated_audio()
                break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for call {call_id}")
    except Exception as e:
        logger.error(f"Stream handler error [{call_id}]: {e}")
    finally:
        # Update call status
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Call).where(Call.id == call_id))
            call = result.scalar_one_or_none()
            if call and call.status == "in_progress":
                call.status = "completed"
                call.ended_at = datetime.now(timezone.utc)
                if call.answered_at:
                    delta = call.ended_at - call.answered_at
                    call.duration_seconds = int(delta.total_seconds())
                await db.flush()
                await db.commit()
        logger.info(f"Stream handler finished for call {call_id}")
