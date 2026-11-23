import io
import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.session import get_db
from app.models.call import Call, Transcript
from app.models.user import User
from app.api.v1.routes.auth import get_optional_user
from app.core.config import settings
from app.providers.stt.openrouter_stt import OpenRouterSTTProvider
from app.providers.conversation.openrouter_chat import OpenRouterChatProvider, ConversationMessage

logger = logging.getLogger(__name__)
router = APIRouter()

QWEN_CORRECTION_MODEL = "qwen/qwen-2.5-72b-instruct"


@router.get("/models/status")
async def get_models_status():
    """
    Returns real-time status of Whisper and Qwen/LLM models for Mobile Home screen.
    Publicly accessible for client connectivity verification.
    """
    stt_provider = OpenRouterSTTProvider()
    stt_ok = False
    try:
        stt_ok = await stt_provider.health_check()
    except Exception as e:
        logger.warning(f"Whisper health check failed: {e}")

    chat_provider = OpenRouterChatProvider(model=QWEN_CORRECTION_MODEL)
    chat_ok = False
    try:
        chat_ok = await chat_provider.health_check()
    except Exception as e:
        logger.warning(f"Qwen health check failed: {e}")

    return {
        "backend_status": "connected",
        "whisper": {
            "model": settings.OPENROUTER_STT_MODEL,
            "status": "ready" if stt_ok else "configured",
            "provider": "OpenRouter / Whisper Large V3",
            "available": True,
        },
        "qwen": {
            "model": QWEN_CORRECTION_MODEL,
            "status": "ready" if chat_ok else "configured",
            "provider": "Qwen 2.5 72B Instruct",
            "available": True,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/upload")
@router.post("")
async def transcribe_audio_file(
    file: UploadFile = File(...),
    apply_qwen_correction: bool = Form(True),
    language: Optional[str] = Form("ar"),
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    Upload recorded audio file, run Whisper transcription, apply optional Qwen correction,
    and persist results into database.
    """
    if not file:
        raise HTTPException(status_code=400, detail="Audio file is required")

    audio_bytes = await file.read()
    if not audio_bytes or len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Audio file is empty or corrupted")

    filename = (file.filename or "").lower()
    ext = os.path.splitext(filename)[1].lstrip(".")
    if not ext:
        if file.content_type and "mp3" in file.content_type:
            ext = "mp3"
        elif file.content_type and "m4a" in file.content_type:
            ext = "m4a"
        elif file.content_type and "ogg" in file.content_type:
            ext = "ogg"
        else:
            ext = "wav"

    logger.info(f"Received audio file for transcription: {filename} ({len(audio_bytes)} bytes, format: {ext})")

    # Step 1: Run Whisper STT
    stt_provider = OpenRouterSTTProvider()
    try:
        stt_res = await stt_provider.transcribe(
            audio_data=audio_bytes,
            audio_format=ext,
            language=language if language and language != "auto" else None,
            verbose=True,
        )
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        raise HTTPException(status_code=500, detail=f"Whisper transcription failed: {str(e)}")

    raw_text = (stt_res.text or "").strip()
    detected_lang = stt_res.language or language or "ar"
    duration = stt_res.duration_seconds or 0.0

    # Step 2: Apply Qwen post-correction if requested and raw transcript is not empty
    corrected_text = raw_text
    qwen_applied = False
    if apply_qwen_correction and raw_text:
        try:
            qwen_provider = OpenRouterChatProvider(model=QWEN_CORRECTION_MODEL)
            prompt = (
                "أنت خبير محترف في التدقيق اللغوي وتصحيح تفريغ الصوت المسجل باللهجة المصرية، الصعيدية، والعربية الفصحى، "
                "وكذلك المصطلحات الإنجليزية المتداخلة (Code-switching).\n\n"
                "المطلوب منك:\n"
                "1. تصحيح الأخطاء الصوتية والكتابية والإملائية دون تغيير كلام أو قصد المتحدث.\n"
                "2. المحافظة على اللهجة المصرية الدارجة الطبيعية والتعبيرات الشعبية بدقة.\n"
                "3. تنظيم علامات الترقيم والفواصل ونهايات الجمل ليكون النص مقروءاً بوضوح.\n"
                "4. إرجاع النص المصحح النهائي فقط بدون أي مقدمات أو شروحات.\n\n"
                f"نص التفريغ الأولي من Whisper:\n\"{raw_text}\""
            )
            chat_res = await qwen_provider.chat([
                ConversationMessage(role="user", content=prompt)
            ], max_tokens=1024, temperature=0.2)

            cleaned = (chat_res.text or "").strip()
            # Strip extra wrapping quotes if present
            if cleaned.startswith('"') and cleaned.endswith('"') and len(cleaned) > 2:
                cleaned = cleaned[1:-1].strip()
            if cleaned:
                corrected_text = cleaned
                qwen_applied = True
        except Exception as e:
            logger.warning(f"Qwen correction error (continuing with raw transcript): {e}")

    # Step 3: Persist into database Call & Transcript records
    now = datetime.now(timezone.utc)
    call_id = uuid.uuid4()
    transcript_id = uuid.uuid4()

    call = Call(
        id=call_id,
        from_number="mobile_app",
        to_number="whisper_qwen",
        direction="inbound",
        call_mode="mobile_transcription",
        status="completed",
        started_at=now,
        ended_at=now,
        duration_seconds=int(duration),
        language=detected_lang,
        ai_summary=corrected_text[:250] if corrected_text else raw_text[:250],
        processing_status="completed",
    )
    db.add(call)
    await db.flush()

    metadata = {
        "whisper_model": settings.OPENROUTER_STT_MODEL,
        "qwen_model": QWEN_CORRECTION_MODEL if qwen_applied else None,
        "qwen_applied": qwen_applied,
        "corrected_text": corrected_text,
        "original_text": raw_text,
        "filename": filename,
        "file_size": len(audio_bytes),
        "duration_seconds": duration,
    }

    transcript = Transcript(
        id=transcript_id,
        call_id=call_id,
        provider="openrouter",
        model=settings.OPENROUTER_STT_MODEL,
        language=detected_lang,
        transcript_text=corrected_text if qwen_applied else raw_text,
        transcription_status="completed",
        confidence_metadata=metadata,
    )
    db.add(transcript)
    await db.commit()

    return {
        "id": str(transcript_id),
        "call_id": str(call_id),
        "original_transcript": raw_text,
        "corrected_transcript": corrected_text,
        "whisper_model": settings.OPENROUTER_STT_MODEL,
        "qwen_model": QWEN_CORRECTION_MODEL if qwen_applied else None,
        "qwen_applied": qwen_applied,
        "language": detected_lang,
        "duration_seconds": duration,
        "created_at": now.isoformat(),
    }


@router.get("")
async def list_transcriptions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """
    List all recent transcriptions with their original and corrected text.
    """
    stmt = (
        select(Transcript, Call)
        .join(Call, Transcript.call_id == Call.id)
        .order_by(desc(Transcript.created_at))
    )
    if search:
        stmt = stmt.where(Transcript.transcript_text.ilike(f"%{search}%"))

    total_stmt = select(Transcript).join(Call, Transcript.call_id == Call.id)
    if search:
        total_stmt = total_stmt.where(Transcript.transcript_text.ilike(f"%{search}%"))
    all_res = await db.execute(total_stmt)
    total = len(all_res.scalars().all())

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    res = await db.execute(stmt)
    items = []
    for t, c in res.all():
        meta = t.confidence_metadata or {}
        orig = meta.get("original_text") or t.transcript_text
        corr = meta.get("corrected_text") or t.transcript_text
        items.append({
            "id": str(t.id),
            "call_id": str(c.id),
            "original_transcript": orig,
            "corrected_transcript": corr,
            "language": t.language or c.language or "ar",
            "duration_seconds": c.duration_seconds or meta.get("duration_seconds", 0),
            "whisper_model": meta.get("whisper_model") or t.model,
            "qwen_model": meta.get("qwen_model"),
            "created_at": (t.created_at or c.created_at).isoformat() if (t.created_at or c.created_at) else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{transcription_id}")
async def get_transcription(
    transcription_id: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """Get single transcription by ID."""
    stmt = select(Transcript, Call).join(Call, Transcript.call_id == Call.id).where(Transcript.id == transcription_id)
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Transcription not found")
    t, c = row
    meta = t.confidence_metadata or {}
    return {
        "id": str(t.id),
        "call_id": str(c.id),
        "original_transcript": meta.get("original_text") or t.transcript_text,
        "corrected_transcript": meta.get("corrected_text") or t.transcript_text,
        "language": t.language or c.language,
        "duration_seconds": c.duration_seconds or meta.get("duration_seconds", 0),
        "whisper_model": meta.get("whisper_model") or t.model,
        "qwen_model": meta.get("qwen_model"),
        "created_at": (t.created_at or c.created_at).isoformat() if (t.created_at or c.created_at) else None,
    }


@router.patch("/{transcription_id}")
async def update_transcription(
    transcription_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """Update corrected or original transcript text."""
    stmt = select(Transcript).where(Transcript.id == transcription_id)
    res = await db.execute(stmt)
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Transcription not found")

    new_text = payload.get("corrected_transcript") or payload.get("transcript_text")
    if new_text is not None:
        t.transcript_text = new_text
        meta = dict(t.confidence_metadata or {})
        meta["corrected_text"] = new_text
        t.confidence_metadata = meta
        await db.commit()

    return {"message": "Transcription updated successfully", "id": transcription_id}


@router.delete("/{transcription_id}")
async def delete_transcription(
    transcription_id: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
):
    """Delete transcription and associated call record."""
    stmt = select(Transcript).where(Transcript.id == transcription_id)
    res = await db.execute(stmt)
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Transcription not found")

    call_id = t.call_id
    await db.delete(t)
    if call_id:
        c_res = await db.execute(select(Call).where(Call.id == call_id))
        c = c_res.scalar_one_or_none()
        if c:
            await db.delete(c)
    await db.commit()
    return {"message": "Transcription deleted successfully"}
