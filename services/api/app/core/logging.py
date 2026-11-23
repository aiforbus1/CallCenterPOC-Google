import logging
import sys
from app.core.config import settings


def configure_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    # Suppress noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    # SQLAlchemy emits SQL via its own logger AND via engine echo simultaneously
    # when echo=True. Setting WARNING here silences the logger-based duplicate.
    # The engine echo flag is controlled separately via SQLALCHEMY_ECHO env var.
    sa_logger = logging.getLogger("sqlalchemy.engine")
    sa_logger.setLevel(logging.WARNING)
    sa_logger.propagate = False  # prevent double-printing to root logger


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
