import base64
from typing import Optional
from pydantic import BaseModel
import logging
from fastapi import APIRouter, Depends, HTTPException

logger = logging.getLogger(__name__)
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.setting import AgentSettingResponse, AgentSettingUpdate
from app.services.agent_settings_service import get_agent_settings, save_agent_settings
from app.providers.tts.openrouter_tts import OpenRouterTTSProvider
from app.api.v1.routes.auth import get_current_user
from app.models.user import User

router = APIRouter()


class TestTTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "Aoede"


@router.get("/agent", response_model=AgentSettingResponse)
async def get_agent_configuration(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Retrieve the current AI Agent configuration: Arabic greeting and ordered questions."""
    return await get_agent_settings(db=db)


@router.put("/agent", response_model=AgentSettingResponse)
async def update_agent_configuration(
    payload: AgentSettingUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update and save the AI Agent configuration: Arabic greeting and ordered questions."""
    return await save_agent_settings(update_data=payload, db=db)


@router.post("/test-tts")
async def test_tts_synthesis(
    payload: TestTTSRequest,
    user: User = Depends(get_current_user),
):
    """Synthesize Arabic speech on demand for live preview in Settings."""
    try:
        tts = OpenRouterTTSProvider()
        res = await tts.synthesize(
            text=payload.text,
            language="ar",
            voice=payload.voice,
            response_format="wav",
        )
        b64 = base64.b64encode(res.audio_data).decode("utf-8")
        return {
            "audio_base64": b64,
            "format": "wav",
            "voice": payload.voice,
            "model": res.model_used,
            "bytes": len(res.audio_data),
        }
    except Exception as e:
        logger.error(f"TTS synthesis error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"فشل تشغيل الصوت: {str(e)}"
        )
