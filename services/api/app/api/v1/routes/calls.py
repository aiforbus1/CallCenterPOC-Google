from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, update
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.call import Call, Transcript, CallExtraction, AuditLog
from app.models.customer import Customer
from app.models.user import User
from app.schemas.call import (
    OutboundCallRequest, CallResponse, CallListResponse,
    TranscriptResponse, ExtractionResponse, ExtractionUpdate, ReviewRequest
)
from app.api.v1.routes.auth import get_current_user
from app.core.config import settings
import logging
import uuid
import time as _time
from typing import Any as _Any

logger = logging.getLogger(__name__)
router = APIRouter()


def call_to_response(c: Call) -> CallResponse:
    now = datetime.now(timezone.utc)
    return CallResponse(
        id=str(c.id),
        provider_call_id=c.provider_call_id,
        customer_id=str(c.customer_id) if c.customer_id else None,
        initiated_by_user_id=str(c.initiated_by_user_id) if c.initiated_by_user_id else None,
        direction=c.direction,
        call_mode=c.call_mode,
        status=c.status,
        from_number=c.from_number,
        to_number=c.to_number,
        started_at=c.started_at,
        answered_at=c.answered_at,
        ended_at=c.ended_at,
        duration_seconds=c.duration_seconds,
        language=c.language,
        recording_reference=c.recording_reference,
        ai_summary=c.ai_summary,
        processing_status=c.processing_status,
        error_code=c.error_code,
        created_at=c.created_at or now,
        updated_at=c.updated_at or now,
    )


@router.get("", response_model=CallListResponse)
async def list_calls(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    direction: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    review_status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Auto-resolve stale calls in 'in_progress' or 'ringing' older than 15 minutes
    try:
        stale_threshold = datetime.now(timezone.utc) - timedelta(minutes=15)
        stale_stmt = (
            update(Call)
            .where(Call.status.in_(["in_progress", "ringing"]))
            .where(or_(Call.started_at < stale_threshold, Call.created_at < stale_threshold))
            .values(
                status="completed",
                ended_at=datetime.now(timezone.utc),
                processing_status="completed"
            )
        )
        await db.execute(stale_stmt)
        await db.flush()
    except Exception as e:
        logger.warning(f"Error auto-closing stale calls: {e}")

    q = select(Call)
    if direction:
        q = q.where(Call.direction == direction)
    if status:
        q = q.where(Call.status == status)
    if customer_id:
        q = q.where(Call.customer_id == customer_id)
    if language:
        q = q.where(Call.language == language)
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar() or 0
    q = q.order_by(Call.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    calls = result.scalars().all()

    # Auto-generate summary for any completed calls that are missing it
    for c in calls:
        if c.status == "completed" and not c.ai_summary:
            t_res = await db.execute(select(Transcript).where(Transcript.call_id == c.id))
            t = t_res.scalar_one_or_none()
            transcript_text = t.transcript_text if (t and t.transcript_text) else ""
            from app.services.call_summarizer import generate_call_summary_and_extraction
            await generate_call_summary_and_extraction(c, transcript_text, db)

    return CallListResponse(
        items=[call_to_response(c) for c in calls],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/outbound", response_model=CallResponse, status_code=201)
async def initiate_outbound_call(
    req: OutboundCallRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role not in ("admin", "operator"):
        raise HTTPException(status_code=403, detail="Operators and admins only")

    # Resolve destination
    to_number = req.to_number
    customer = None
    if req.customer_id and str(req.customer_id).strip() not in ("", "string", "null", "none"):
        try:
            cust_uuid = uuid.UUID(str(req.customer_id).strip())
            result = await db.execute(select(Customer).where(Customer.id == cust_uuid))
            customer = result.scalar_one_or_none()
            if not customer:
                raise HTTPException(status_code=404, detail="Customer not found")
            if not customer.consent_status == "granted":
                raise HTTPException(
                    status_code=403,
                    detail="Customer has not granted consent for outbound calls"
                )
            to_number = customer.phone_number
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid customer_id format (must be a valid UUID)")

    if not to_number:
        raise HTTPException(status_code=400, detail="to_number or customer_id required")

    # Check outbound restrictions
    allowed = settings.allowed_outbound_list
    if allowed and to_number not in allowed:
        raise HTTPException(
            status_code=403,
            detail=f"Destination {to_number} not in ALLOWED_OUTBOUND_DESTINATIONS"
        )

    call_mode = req.call_mode
    from_number = settings.TWILIO_PHONE_NUMBER or "+10000000000"

    if call_mode == "real" and not settings.twilio_configured:
        raise HTTPException(
            status_code=503,
            detail="Telephony provider not configured. Set TELEPHONY_PROVIDER=simulated or provide Twilio credentials."
        )

    call = Call(
        customer_id=customer.id if customer else None,
        initiated_by_user_id=user.id,
        direction="outbound",
        call_mode=call_mode,
        status="initiated",
        from_number=from_number,
        to_number=to_number,
        started_at=datetime.now(timezone.utc),
        language=req.language or (customer.preferred_language if customer else "en"),
        processing_status="pending",
    )
    db.add(call)
    await db.flush()
    await db.refresh(call)

    if call_mode == "real" and settings.twilio_configured:
        # Launch actual Twilio call in background
        background_tasks.add_task(_initiate_twilio_call, str(call.id), to_number, from_number)
    elif call_mode in ("simulated", "mobile"):
        # Mobile in-app / simulated voice call
        call.status = "in_progress"
        call.answered_at = datetime.now(timezone.utc)
        call.provider_call_id = f"mobile_{call.id}"
        await db.flush()

    logger.info(f"Outbound call initiated: {call.id}, mode={call_mode}, to={to_number}")
    return call_to_response(call)


class SimulateIncomingCallRequest(BaseModel):
    customer_name: Optional[str] = "مواطن (ببلاغ طارئ)"
    phone_number: Optional[str] = "+201234567890"
    language: str = "ar-EG"
    notes: Optional[str] = "مواطن يتصل للإبلاغ عن حالة طارئة لشرطة النجدة 122"


@router.post("/mobile/simulate-incoming", response_model=CallResponse, status_code=201)
async def simulate_incoming_call(
    req: SimulateIncomingCallRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Simulate an inbound call ringing on the mobile operator's phone.
    """
    # Find or create customer
    customer = None
    if req.phone_number:
        result = await db.execute(select(Customer).where(Customer.phone_number == req.phone_number))
        customer = result.scalar_one_or_none()
        if not customer and req.customer_name:
            customer = Customer(
                full_name=req.customer_name,
                phone_number=req.phone_number,
                preferred_language=req.language,
                consent_status="granted",
                notes=req.notes,
            )
            db.add(customer)
            await db.flush()
            await db.refresh(customer)

    call = Call(
        customer_id=customer.id if customer else None,
        direction="inbound",
        call_mode="mobile",
        status="ringing",
        from_number=req.phone_number or "+201234567890",
        to_number="+20200000000",
        started_at=datetime.now(timezone.utc),
        language=req.language,
        processing_status="pending",
    )
    db.add(call)
    await db.flush()
    await db.refresh(call)
    logger.info(f"Simulated incoming call created: {call.id} (status: ringing)")
    return call_to_response(call)


# ── 1-second in-process cache for /mobile/incoming ───────────────────────────
# Prevents a DB hit on every poll tick from the mobile APK (~3s interval).
# Cache is per-process; with multiple uvicorn workers each has its own cache,
# which is acceptable — worst case a worker returns a 1s-stale result.
_incoming_cache: dict[str, _Any] = {"ts": 0.0, "payload": None}
_INCOMING_CACHE_TTL = 1.0  # seconds


@router.get("/mobile/incoming")
async def get_incoming_call(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Check if there is an active ringing inbound call waiting to be answered on mobile.
    Results are cached for 1 second to reduce DB round-trips from aggressive polling.
    """
    now = _time.monotonic()
    if now - _incoming_cache["ts"] < _INCOMING_CACHE_TTL and _incoming_cache["payload"] is not None:
        return _incoming_cache["payload"]

    result = await db.execute(
        select(Call).where(Call.direction == "inbound", Call.status == "ringing").order_by(Call.created_at.desc())
    )
    call = result.scalars().first()
    if not call:
        payload = {"ringing": False, "call": None}
        _incoming_cache.update(ts=now, payload=payload)
        return payload

    cust_name = None
    if call.customer_id:
        c_res = await db.execute(select(Customer).where(Customer.id == call.customer_id))
        cust = c_res.scalar_one_or_none()
        if cust:
            cust_name = cust.full_name

    is_ar = (call.language or "ar").startswith("ar")
    default_cust_name = "مبلّغ (122)" if is_ar else "Reporter (122)"
    payload = {
        "ringing": True,
        "call": call_to_response(call),
        "customer_name": cust_name or default_cust_name,
    }
    _incoming_cache.update(ts=now, payload=payload)
    return payload


async def _initiate_twilio_call(call_id: str, to_number: str, from_number: str):
    """Background task: send outbound call request to Twilio."""
    from twilio.rest import Client
    from app.db.session import AsyncSessionLocal
    from sqlalchemy import select
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Call).where(Call.id == call_id))
        call = result.scalar_one_or_none()
        if not call:
            return
        try:
            webhook_url = f"{settings.PUBLIC_API_BASE_URL}/api/v1/webhooks/telephony/incoming"
            status_url = f"{settings.PUBLIC_API_BASE_URL}/api/v1/webhooks/telephony/status"
            twilio_call = client.calls.create(
                to=to_number,
                from_=from_number,
                url=webhook_url,
                status_callback=status_url,
                status_callback_method="POST",
                record=settings.RECORDING_ENABLED,
            )
            call.provider_call_id = twilio_call.sid
            call.status = "ringing"
            await db.commit()
            logger.info(f"Twilio call created: {twilio_call.sid}")
        except Exception as e:
            call.status = "failed"
            call.error_code = str(e)[:50]
            await db.commit()
            logger.error(f"Twilio call failed: {e}")


@router.get("/{call_id}", response_model=CallResponse)
async def get_call(
    call_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Call).where(Call.id == call_id))
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    if call.status == "completed" and not call.ai_summary:
        t_res = await db.execute(select(Transcript).where(Transcript.call_id == call.id))
        t = t_res.scalar_one_or_none()
        transcript_text = t.transcript_text if (t and t.transcript_text) else ""
        from app.services.call_summarizer import generate_call_summary_and_extraction
        await generate_call_summary_and_extraction(call, transcript_text, db)
        await db.flush()

    return call_to_response(call)


@router.post("/{call_id}/end")
async def end_call(
    call_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Call).where(Call.id == call_id))
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    if call.status in ("completed", "failed", "missed"):
        return {"message": f"Call already in terminal status: {call.status}"}

    if call.call_mode == "real" and call.provider_call_id and settings.twilio_configured:
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.calls(call.provider_call_id).update(status="completed")
        except Exception as e:
            logger.warning(f"Twilio end call error: {e}")

    call.status = "completed"
    call.ended_at = datetime.now(timezone.utc)
    if call.answered_at:
        delta = call.ended_at - call.answered_at
        call.duration_seconds = int(delta.total_seconds())
    call.processing_status = "completed"

    # Ensure summary and extraction are generated
    t_res = await db.execute(select(Transcript).where(Transcript.call_id == call.id))
    t = t_res.scalar_one_or_none()
    transcript_text = t.transcript_text if (t and t.transcript_text) else ""
    from app.services.call_summarizer import generate_call_summary_and_extraction
    await generate_call_summary_and_extraction(call, transcript_text, db)

    await db.flush()
    return {"message": "Call ended", "call_id": call_id}


@router.post("/cleanup-stale")
async def cleanup_stale_calls(
    max_age_minutes: int = Query(5, ge=1, le=1440),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Marks orphaned or abandoned calls older than max_age_minutes as completed."""
    threshold = datetime.now(timezone.utc) - timedelta(minutes=max_age_minutes)
    res = await db.execute(
        select(Call).where(
            Call.status.in_(["in_progress", "ringing"]),
            or_(Call.started_at < threshold, Call.created_at < threshold)
        )
    )
    stale_calls = res.scalars().all()
    for c in stale_calls:
        c.status = "completed"
        c.ended_at = c.ended_at or datetime.now(timezone.utc)
        if c.started_at and not c.duration_seconds:
            c.duration_seconds = max(1, int((c.ended_at - c.started_at).total_seconds()))
    await db.commit()
    return {"message": f"Cleaned up {len(stale_calls)} stale calls", "count": len(stale_calls)}


@router.post("/{call_id}/answer")
async def answer_call(
    call_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Call).where(Call.id == call_id))
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    call.status = "in_progress"
    call.answered_at = datetime.now(timezone.utc)
    await db.flush()
    return {"message": "Call answered", "call": call_to_response(call)}


@router.post("/{call_id}/decline")
async def decline_call(
    call_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Call).where(Call.id == call_id))
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    call.status = "missed"
    call.ended_at = datetime.now(timezone.utc)
    await db.flush()
    return {"message": "Call declined", "call": call_to_response(call)}


@router.get("/{call_id}/transcript", response_model=TranscriptResponse)
async def get_transcript(
    call_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Transcript).where(Transcript.call_id == call_id))
    transcript = result.scalar_one_or_none()
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return TranscriptResponse(
        id=str(transcript.id),
        call_id=str(transcript.call_id),
        provider=transcript.provider,
        model=transcript.model,
        language=transcript.language,
        transcript_text=transcript.transcript_text,
        transcription_status=transcript.transcription_status,
        confidence_metadata=transcript.confidence_metadata,
        created_at=transcript.created_at,
        updated_at=transcript.updated_at,
    )


@router.get("/{call_id}/extraction", response_model=ExtractionResponse)
async def get_extraction(
    call_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(CallExtraction).where(CallExtraction.call_id == call_id))
    extraction = result.scalar_one_or_none()
    if not extraction:
        raise HTTPException(status_code=404, detail="Extraction not found")
    return ExtractionResponse(
        id=str(extraction.id),
        call_id=str(extraction.call_id),
        customer_id=str(extraction.customer_id) if extraction.customer_id else None,
        intent=extraction.intent,
        customer_name=extraction.customer_name,
        callback_number=extraction.callback_number,
        summary=extraction.summary,
        priority=extraction.priority,
        requested_action=extraction.requested_action,
        appointment_requested=extraction.appointment_requested,
        follow_up_required=extraction.follow_up_required,
        category=extraction.category,
        assigned_department=extraction.assigned_department,
        department_phone=extraction.department_phone,
        outbound_call_triggered=extraction.outbound_call_triggered,
        outbound_call_id=str(extraction.outbound_call_id) if extraction.outbound_call_id else None,
        extracted_json=extraction.extracted_json,
        validation_status=extraction.validation_status,
        review_status=extraction.review_status,
        reviewed_by_user_id=str(extraction.reviewed_by_user_id) if extraction.reviewed_by_user_id else None,
        reviewed_at=extraction.reviewed_at,
        created_at=extraction.created_at,
        updated_at=extraction.updated_at,
    )


@router.patch("/{call_id}/extraction", response_model=ExtractionResponse)
async def update_extraction(
    call_id: str,
    req: ExtractionUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(CallExtraction).where(CallExtraction.call_id == call_id))
    extraction = result.scalar_one_or_none()
    if not extraction:
        raise HTTPException(status_code=404, detail="Extraction not found")

    old_values = {
        "intent": extraction.intent,
        "summary": extraction.summary,
        "priority": extraction.priority,
    }
    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(extraction, field, value)

    # Create audit log
    audit = AuditLog(
        user_id=user.id,
        entity_type="call_extraction",
        entity_id=str(extraction.id),
        action="update",
        old_values=old_values,
        new_values=update_data,
    )
    db.add(audit)
    await db.flush()
    await db.refresh(extraction)
    return ExtractionResponse(
        id=str(extraction.id),
        call_id=str(extraction.call_id),
        customer_id=str(extraction.customer_id) if extraction.customer_id else None,
        intent=extraction.intent,
        customer_name=extraction.customer_name,
        callback_number=extraction.callback_number,
        summary=extraction.summary,
        priority=extraction.priority,
        requested_action=extraction.requested_action,
        appointment_requested=extraction.appointment_requested,
        follow_up_required=extraction.follow_up_required,
        extracted_json=extraction.extracted_json,
        validation_status=extraction.validation_status,
        review_status=extraction.review_status,
        reviewed_by_user_id=str(extraction.reviewed_by_user_id) if extraction.reviewed_by_user_id else None,
        reviewed_at=extraction.reviewed_at,
        created_at=extraction.created_at,
        updated_at=extraction.updated_at,
    )


@router.post("/{call_id}/review")
async def review_call(
    call_id: str,
    req: ReviewRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(CallExtraction).where(CallExtraction.call_id == call_id))
    extraction = result.scalar_one_or_none()
    if not extraction:
        raise HTTPException(status_code=404, detail="Extraction not found")
    extraction.review_status = "reviewed"
    extraction.reviewed_by_user_id = user.id
    extraction.reviewed_at = datetime.now(timezone.utc)
    audit = AuditLog(
        user_id=user.id,
        entity_type="call_extraction",
        entity_id=str(extraction.id),
        action="review",
        new_values={"notes": req.notes, "review_status": "reviewed"},
    )
    db.add(audit)
    await db.flush()
    return {"message": "Call marked as reviewed", "call_id": call_id}
