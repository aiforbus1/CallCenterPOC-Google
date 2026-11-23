from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.logging import configure_logging
from app.api.v1.router import api_v1_router, v1_router, api_router, api_v1_caps, v1_caps
from app.telephony.stream_handler import handle_twilio_stream
from app.telephony.mobile_stream_handler import handle_mobile_stream
import logging

configure_logging()
logger = logging.getLogger(__name__)


class UTF8HeaderMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        content_type = response.headers.get("content-type")
        if content_type and "application/json" in content_type and "charset" not in content_type:
            response.headers["content-type"] = "application/json; charset=utf-8"
        return response


async def ensure_default_admin():
    try:
        from app.db.session import AsyncSessionLocal
        from app.models.user import User, UserRole
        from app.core.security import hash_password
        from sqlalchemy import select

        async with AsyncSessionLocal() as session:
            stmt = select(User).where(User.email == "admin@callcenter.poc")
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                admin_user = User(
                    email="admin@callcenter.poc",
                    password_hash=hash_password("Admin123!"),
                    display_name="Admin User",
                    role=UserRole.ADMIN,
                    is_active=True,
                )
                session.add(admin_user)
                logger.info("Auto-bootstrapped default admin: admin@callcenter.poc")

            stmt_local = select(User).where(User.email == "admin@callcenter.local")
            res_local = await session.execute(stmt_local)
            if not res_local.scalar_one_or_none():
                local_admin = User(
                    email="admin@callcenter.local",
                    password_hash=hash_password("Admin123456!"),
                    display_name="Admin User",
                    role=UserRole.ADMIN,
                    is_active=True,
                )
                session.add(local_admin)
                logger.info("Auto-bootstrapped local admin: admin@callcenter.local")

            stmt_122 = select(User).where(User.email == "admin122@callcenter.local")
            res_122 = await session.execute(stmt_122)
            if not res_122.scalar_one_or_none():
                admin122 = User(
                    email="admin122@callcenter.local",
                    password_hash=hash_password("Admin123456789!"),
                    display_name="Admin User",
                    role=UserRole.ADMIN,
                    is_active=True,
                )
                session.add(admin122)
                logger.info("Auto-bootstrapped mobile admin: admin122@callcenter.local")

            await session.commit()
    except Exception as e:
        logger.warning(f"Could not auto-bootstrap default admin accounts: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting AI Call Center API [{settings.ENVIRONMENT}]")
    logger.info(f"STT Model: {settings.OPENROUTER_STT_MODEL}")
    logger.info(f"TTS Model: {settings.OPENROUTER_TTS_MODEL}")
    logger.info(f"Chat Model: {settings.OPENROUTER_CHAT_MODEL}")
    logger.info(f"Telephony: {settings.TELEPHONY_PROVIDER}")
    if not settings.twilio_configured:
        logger.warning("Twilio NOT configured — running in simulated/mobile telephony mode")

    # 1. Automatically ensure all tables exist in database (Self-Healing Schema)
    try:
        from app.db.base import Base
        from app.db.session import engine
        from app.models.user import User
        from app.models.customer import Customer
        from app.models.call import Call, Transcript, CallExtraction
        from app.models.setting import AgentSetting
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema verified and tables ensured.")
    except Exception as e:
        logger.error(f"Error ensuring database tables on startup: {e}")

    # 2. Ensure default admin accounts exist
    await ensure_default_admin()
    yield
    logger.info("Shutting down AI Call Center API")


app = FastAPI(
    title="AI Call Center API",
    description="AI-powered call center backend with Mobile App VoIP, Twilio, OpenRouter (Whisper + Gemini TTS), and PostgreSQL",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(UTF8HeaderMiddleware)

# API routes (support /api/v1, /v1, /api, /api/V1, /V1)
app.include_router(api_v1_router)
app.include_router(v1_router)
app.include_router(api_router)
app.include_router(api_v1_caps)
app.include_router(v1_caps)


@app.websocket("/api/v1/calls/stream/{call_id}")
@app.websocket("/api/V1/calls/stream/{call_id}")
@app.websocket("/api/calls/stream/{call_id}")
@app.websocket("/v1/calls/stream/{call_id}")
@app.websocket("/calls/stream/{call_id}")
async def mobile_calls_stream_endpoint(websocket: WebSocket, call_id: str):
    """
    WebSocket endpoint for Mobile App in-app voice calls.
    Direct bidirectional real-time audio and speech stream.
    """
    await handle_mobile_stream(websocket, call_id)


@app.websocket("/api/v1/telephony/stream/{call_id}")
async def telephony_stream_endpoint(websocket: WebSocket, call_id: str):
    """
    WebSocket endpoint for Twilio Media Streams or Mobile Client fallback.
    """
    client_type = websocket.query_params.get("client")
    if client_type == "mobile":
        await handle_mobile_stream(websocket, call_id)
    else:
        await handle_twilio_stream(websocket, call_id)


@app.get("/")
async def root():
    return {
        "name": "AI Call Center API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/api/v1/health",
    }
