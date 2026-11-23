import logging
from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.call import Call, CallEvent
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


def _validate_twilio_signature(request_url: str, form_params: dict, signature: str) -> bool:
    """Validate Twilio webhook signature."""
    if not settings.TWILIO_AUTH_TOKEN:
        logger.warning("Twilio auth token not set; skipping signature validation (dev mode)")
        return True
    try:
        from twilio.request_validator import RequestValidator
        validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
        return validator.validate(request_url, form_params, signature)
    except Exception as e:
        logger.error(f"Signature validation error: {e}")
        return False


@router.post("/telephony/incoming")
async def inbound_call_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Twilio inbound call webhook.
    Responds with TwiML to connect the caller to the media stream websocket.
    """
    form_data = dict(await request.form())
    signature = request.headers.get("X-Twilio-Signature", "")
    request_url = str(request.url)

    if not _validate_twilio_signature(request_url, form_data, signature):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature")

    call_sid = form_data.get("CallSid", "")
    from_number = form_data.get("From", "")
    to_number = form_data.get("To", "")

    # Idempotency: check for existing call record
    existing = await db.execute(select(Call).where(Call.provider_call_id == call_sid))
    call = existing.scalar_one_or_none()
    if not call:
        call = Call(
            provider_call_id=call_sid,
            direction="inbound",
            call_mode="real",
            status="ringing",
            from_number=from_number,
            to_number=to_number,
            started_at=datetime.now(timezone.utc),
            language="en",
            processing_status="pending",
        )
        db.add(call)
        await db.flush()
        await db.refresh(call)
        logger.info(f"Inbound call received: SID={call_sid}, from={from_number}")

    # Emit call event
    event = CallEvent(
        call_id=call.id,
        event_type="inbound_webhook",
        event_timestamp=datetime.now(timezone.utc),
        event_data=form_data,
    )
    db.add(event)
    await db.flush()
    await db.commit()

    # Build TwiML response to connect to media stream
    ws_url = f"{settings.PUBLIC_MEDIA_WEBSOCKET_URL}/api/v1/telephony/stream/{str(call.id)}"
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello, you have reached the AI assistant. Please wait while I connect you.</Say>
  <Connect>
    <Stream url="{ws_url}" />
  </Connect>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


@router.post("/telephony/status")
async def call_status_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Twilio call status callback."""
    form_data = dict(await request.form())
    signature = request.headers.get("X-Twilio-Signature", "")

    if not _validate_twilio_signature(str(request.url), form_data, signature):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature")

    call_sid = form_data.get("CallSid", "")
    call_status = form_data.get("CallStatus", "").lower()
    duration = form_data.get("CallDuration")

    STATUS_MAP = {
        "queued": "initiated",
        "ringing": "ringing",
        "in-progress": "in_progress",
        "completed": "completed",
        "failed": "failed",
        "busy": "busy",
        "no-answer": "no_answer",
        "canceled": "failed",
    }

    result = await db.execute(select(Call).where(Call.provider_call_id == call_sid))
    call = result.scalar_one_or_none()
    if call:
        mapped_status = STATUS_MAP.get(call_status, call_status)
        call.status = mapped_status
        if duration:
            call.duration_seconds = int(duration)
        if call_status == "in-progress" and not call.answered_at:
            call.answered_at = datetime.now(timezone.utc)
        if call_status in ("completed", "failed", "busy", "no-answer", "canceled"):
            call.ended_at = datetime.now(timezone.utc)
            if mapped_status == "completed":
                # Trigger post-call processing
                background_tasks.add_task(_trigger_post_call_processing, str(call.id))

        event = CallEvent(
            call_id=call.id,
            event_type=f"status_{call_status}",
            event_timestamp=datetime.now(timezone.utc),
            event_data=form_data,
        )
        db.add(event)
        await db.flush()
        await db.commit()
        logger.info(f"Call status update: SID={call_sid}, status={call_status}")

    return Response(content="", status_code=204)


@router.post("/telephony/recording")
async def recording_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Twilio recording available callback."""
    form_data = dict(await request.form())
    call_sid = form_data.get("CallSid", "")
    recording_url = form_data.get("RecordingUrl", "")
    recording_sid = form_data.get("RecordingSid", "")

    result = await db.execute(select(Call).where(Call.provider_call_id == call_sid))
    call = result.scalar_one_or_none()
    if call:
        call.recording_reference = recording_url or recording_sid
        await db.flush()
        await db.commit()
        logger.info(f"Recording available for call {call_sid}: {recording_url}")
        background_tasks.add_task(_trigger_post_call_processing, str(call.id))

    return Response(content="", status_code=204)


async def _trigger_post_call_processing(call_id: str):
    """Enqueue post-call processing job."""
    try:
        from app.workers.tasks import process_completed_call
        process_completed_call.delay(call_id)
        logger.info(f"Post-call processing enqueued for call {call_id}")
    except Exception as e:
        logger.error(f"Failed to enqueue post-call processing: {e}")
