import asyncio
import logging
import json
from datetime import datetime, timezone
from typing import Optional
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Run an async coroutine in a sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    name="app.workers.tasks.process_completed_call"
)
def process_completed_call(self, call_id: str):
    """
    Post-call processing pipeline:
    1. Fetch call and recording reference
    2. Download recording audio
    3. Transcribe via Whisper Large V3 Turbo (OpenRouter)
    4. Extract structured data via LLM
    5. Save results to PostgreSQL
    """
    logger.info(f"Starting post-call processing for call {call_id}")
    try:
        _run_async(_process_call_async(call_id))
    except Exception as exc:
        logger.error(f"Post-call processing failed for {call_id}: {exc}")
        raise self.retry(exc=exc)


async def _process_call_async(call_id: str):
    from sqlalchemy import select
    from app.db.session import AsyncSessionLocal
    from app.models.call import Call, Transcript, CallExtraction
    from app.providers.stt.openrouter_stt import OpenRouterSTTProvider
    from app.providers.conversation.openrouter_chat import OpenRouterChatProvider
    from app.providers.conversation.base import ConversationMessage
    from app.schemas.extraction import ExtractionResult
    from app.core.config import settings
    import httpx
    import pydantic

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Call).where(Call.id == call_id))
        call = result.scalar_one_or_none()
        if not call:
            logger.error(f"Call {call_id} not found")
            return

        # Check idempotency — skip if already processed
        existing_transcript = await db.execute(select(Transcript).where(Transcript.call_id == call.id))
        if existing_transcript.scalar_one_or_none():
            logger.info(f"Transcript already exists for call {call_id}, skipping")
            return

        call.processing_status = "processing"
        await db.flush()
        await db.commit()

    # --- Step 1: Get recording audio ---
    audio_data: Optional[bytes] = None
    if call.recording_reference:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # For Twilio recordings, append .wav to the URL
                rec_url = call.recording_reference
                if not rec_url.endswith(".wav"):
                    rec_url = rec_url + ".wav"
                if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
                    resp = await client.get(
                        rec_url,
                        auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                    )
                else:
                    resp = await client.get(rec_url)
                resp.raise_for_status()
                audio_data = resp.content
                logger.info(f"Downloaded recording: {len(audio_data)} bytes")
        except Exception as e:
            logger.error(f"Failed to download recording for call {call_id}: {e}")

    # --- Step 2: Transcribe ---
    transcript_text = ""
    transcription_status = "failed"
    confidence_metadata = None
    detected_language = call.language or "en"

    if audio_data:
        try:
            stt = OpenRouterSTTProvider()
            stt_result = await stt.transcribe(
                audio_data=audio_data,
                audio_format="wav",
                language=None,  # auto-detect
                verbose=True,
            )
            raw_transcript = (stt_result.text or "").strip()
            detected_language = stt_result.language or detected_language
            confidence_metadata = stt_result.confidence_metadata

            # Refine and correct Whisper transcription using Gemma (google/gemma-4-26b-a4b-it)
            stt_needs_review = False
            stt_reasons = []
            try:
                from app.services.stt_corrector import default_gemma_corrector
                corr_res = await default_gemma_corrector.correct_transcription(
                    raw_transcript,
                    language=detected_language,
                )
                transcript_text = str(corr_res)
                stt_needs_review = bool(getattr(corr_res, "needs_review", False))
                stt_reasons = list(getattr(corr_res, "reasons", []))
            except Exception as e_corr:
                logger.warning(f"Gemma STT correction fallback to raw transcript: {e_corr}")
                transcript_text = raw_transcript
                stt_needs_review = True
                stt_reasons = [f"Exception: {e_corr}"]

            # Explicitly persist needs_review and reasons inside confidence_metadata
            if confidence_metadata is None or not isinstance(confidence_metadata, dict):
                confidence_metadata = {}
            confidence_metadata["stt_corrector"] = {
                "model": "google/gemma-4-26b-a4b-it",
                "raw_transcript": raw_transcript,
                "needs_review": stt_needs_review,
                "reasons": stt_reasons,
            }

            transcription_status = "completed"
            logger.info(f"Transcription complete & corrected via Gemma for call {call_id}: {len(transcript_text)} chars")
        except Exception as e:
            logger.error(f"STT failed for call {call_id}: {e}")
            transcription_status = "failed"
    else:
        logger.warning(f"No recording available for call {call_id}, skipping STT")
        transcription_status = "no_recording"

    # --- Step 3: Save transcript ---
    async with AsyncSessionLocal() as db:
        from app.core.config import settings as s
        transcript_obj = Transcript(
            call_id=call.id,
            provider="openrouter",
            model=s.OPENROUTER_STT_MODEL,
            language=detected_language,
            transcript_text=transcript_text or "[No audio available]",
            transcription_status=transcription_status,
            confidence_metadata=confidence_metadata,
        )
        db.add(transcript_obj)
        await db.flush()
        await db.commit()

    # --- Step 4: Extract structured data ---
    extraction_data = {}
    if transcript_text:
        try:
            chat = OpenRouterChatProvider()
            extraction_prompt = f"""You are an expert call center analyst. Extract structured information from this call transcript.

Transcript:
{transcript_text}

Return ONLY valid JSON matching this schema:
{{
  "customer_name": "string or null",
  "callback_number": "string or null",
  "language": "ar-EG or en",
  "intent": "brief description of why customer called",
  "summary": "2-3 sentence summary of the call",
  "priority": "low | normal | high | urgent",
  "requested_action": "what action needs to be taken or null",
  "appointment_requested": "ISO datetime or null",
  "follow_up_required": true or false,
  "missing_information": ["list of missing fields"],
  "validation_status": "valid | needs_review"
}}

Return only the JSON object, no markdown or explanation."""

            resp = await chat.chat(
                messages=[ConversationMessage(role="user", content=extraction_prompt)],
                max_tokens=512,
                temperature=0.1,
            )
            raw = resp.text.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            extraction_data = json.loads(raw)
            # Validate with Pydantic
            validated = ExtractionResult(**extraction_data)
            extraction_data = validated.model_dump()
            logger.info(f"Extraction complete for call {call_id}")
        except Exception as e:
            logger.error(f"Extraction failed for call {call_id}: {e}")
            extraction_data = {"summary": "Extraction failed", "priority": "normal", "follow_up_required": False}

    # --- Step 5: Save extraction and update call ---
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Call).where(Call.id == call.id))
        call_obj = result.scalar_one_or_none()

        extraction_obj = CallExtraction(
            call_id=call.id,
            intent=extraction_data.get("intent"),
            customer_name=extraction_data.get("customer_name"),
            callback_number=extraction_data.get("callback_number"),
            summary=extraction_data.get("summary"),
            priority=extraction_data.get("priority", "normal"),
            requested_action=extraction_data.get("requested_action"),
            follow_up_required=extraction_data.get("follow_up_required", False),
            extracted_json=extraction_data,
            validation_status=extraction_data.get("validation_status", "needs_review"),
            review_status="pending",
        )
        db.add(extraction_obj)

        if call_obj:
            call_obj.ai_summary = extraction_data.get("summary", "")
            call_obj.processing_status = "completed"

        await db.flush()
        await db.commit()
        logger.info(f"Post-call processing complete for call {call_id}")
