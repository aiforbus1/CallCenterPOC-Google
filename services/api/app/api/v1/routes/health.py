from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings
from app.providers.stt.openrouter_stt import OpenRouterSTTProvider
from app.providers.tts.openrouter_tts import OpenRouterTTSProvider
from app.providers.conversation.openrouter_chat import OpenRouterChatProvider

router = APIRouter()


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Basic health check."""
    try:
        await db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {e}"

    return {
        "status": "ok",
        "database": db_status,
        "environment": settings.ENVIRONMENT,
        "telephony_provider": settings.TELEPHONY_PROVIDER,
        "twilio_configured": settings.twilio_configured,
        "stt_model": settings.OPENROUTER_STT_MODEL,
        "tts_model": settings.OPENROUTER_TTS_MODEL,
        "chat_model": settings.OPENROUTER_CHAT_MODEL,
    }


@router.get("/health/providers")
async def providers_health():
    """Check all AI provider connections."""
    stt = OpenRouterSTTProvider()
    tts = OpenRouterTTSProvider()
    chat = OpenRouterChatProvider()

    results = {}
    try:
        results["stt"] = {"model": settings.OPENROUTER_STT_MODEL, "ok": await stt.health_check()}
    except Exception as e:
        results["stt"] = {"model": settings.OPENROUTER_STT_MODEL, "ok": False, "error": str(e)}
    try:
        results["tts"] = {"model": settings.OPENROUTER_TTS_MODEL, "ok": await tts.health_check()}
    except Exception as e:
        results["tts"] = {"model": settings.OPENROUTER_TTS_MODEL, "ok": False, "error": str(e)}
    try:
        results["chat"] = {"model": settings.OPENROUTER_CHAT_MODEL, "ok": await chat.health_check()}
    except Exception as e:
        results["chat"] = {"model": settings.OPENROUTER_CHAT_MODEL, "ok": False, "error": str(e)}

    all_ok = all(v.get("ok") for v in results.values())
    return {"status": "ok" if all_ok else "degraded", "providers": results}
