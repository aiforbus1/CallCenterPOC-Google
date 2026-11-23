from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings

import os as _os

# Async engine for FastAPI
# SQLALCHEMY_ECHO=true in .env enables SQL query logging (dev only).
# Defaults to False so production never double-logs.
_sqlalchemy_echo = _os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"

async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=_sqlalchemy_echo,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)
engine = async_engine  # Alias for backward compatibility

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Sync engine for Alembic
sync_engine = create_engine(
    settings.DATABASE_SYNC_URL,
    echo=False,
    pool_pre_ping=True,
)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
