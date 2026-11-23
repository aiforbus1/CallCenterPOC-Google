from fastapi import APIRouter
from app.api.v1.routes import auth, customers, calls, webhooks, health, settings, users, transcriptions

api_v1_router = APIRouter(prefix="/api/v1")
v1_router = APIRouter(prefix="/v1")
api_router = APIRouter(prefix="/api")
api_v1_caps = APIRouter(prefix="/api/V1")
v1_caps = APIRouter(prefix="/V1")

ALL_API_ROUTERS = [api_v1_router, v1_router, api_router, api_v1_caps, v1_caps]

for r in ALL_API_ROUTERS:
    r.include_router(health.router, tags=["health"])
    r.include_router(auth.router, prefix="/auth", tags=["auth"])
    r.include_router(users.router, tags=["users"])
    r.include_router(customers.router, prefix="/customers", tags=["customers"])
    r.include_router(calls.router, prefix="/calls", tags=["calls"])
    r.include_router(transcriptions.router, prefix="/transcriptions", tags=["transcriptions"])
    r.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
    r.include_router(settings.router, prefix="/settings", tags=["settings"])



@api_v1_router.get("")
@api_v1_router.get("/")
async def api_v1_root():
    return {
        "message": "AI Call Center API v1",
        "status": "healthy",
        "docs": "/api/docs",
        "health": "/api/v1/health",
    }
