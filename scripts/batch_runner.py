#!/usr/bin/env python3
"""
Unified Batch Runner & Operations Utility for AI Call Center POC.
Executes batch operations, migrations, health audits, and scheduled post-processing jobs.

Usage:
    python scripts/batch_runner.py --batch-type process-calls [--limit 50]
    python scripts/batch_runner.py --batch-type migrate
    python scripts/batch_runner.py --batch-type seed
    python scripts/batch_runner.py --batch-type audit
"""
import argparse
import asyncio
import json
import logging
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add services/api to sys.path
ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "services" / "api"
sys.path.insert(0, str(API_DIR))

# Load environment variables if python-dotenv is present
try:
    from dotenv import load_dotenv
    load_dotenv(ROOT_DIR / ".env")
    load_dotenv(API_DIR / ".env")
except ImportError:
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("batch-runner")


def run_migration():
    """Execute Alembic migrations to latest head."""
    logger.info("Executing database migration (alembic upgrade head)...")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=str(API_DIR),
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        logger.error(f"Migration failed:\n{result.stderr}")
        return False, result.stderr
    logger.info(f"Migration output:\n{result.stdout}")
    return True, result.stdout


def run_seed():
    """Execute database seed script."""
    logger.info("Executing database seed...")
    seed_script = ROOT_DIR / "scripts" / "seed.py"
    result = subprocess.run(
        [sys.executable, str(seed_script)],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        logger.error(f"Seed failed:\n{result.stderr}")
        return False, result.stderr
    logger.info(f"Seed output:\n{result.stdout}")
    return True, result.stdout


async def run_audit():
    """Performs an operational health check on DB and external AI providers."""
    logger.info("Performing operational audit...")
    audit_results = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "unknown",
        "openrouter_api": "unknown",
        "status": "healthy"
    }

    try:
        from app.db.session import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        audit_results["database"] = "connected"
    except Exception as e:
        logger.error(f"Database audit error: {e}")
        audit_results["database"] = f"error: {str(e)}"
        audit_results["status"] = "degraded"

    try:
        import httpx
        from app.core.config import settings
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "HTTP-Referer": "https://callcenter.internal",
            "X-Title": "CallCenter POC Audit"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{settings.OPENROUTER_BASE_URL}/models", headers=headers)
            if resp.status_code == 200:
                audit_results["openrouter_api"] = "authenticated"
            else:
                audit_results["openrouter_api"] = f"status {resp.status_code}"
                audit_results["status"] = "degraded"
    except Exception as e:
        logger.warning(f"OpenRouter audit check: {e}")
        audit_results["openrouter_api"] = f"warning: {str(e)}"

    print(json.dumps(audit_results, indent=2))
    return audit_results["status"] == "healthy"


async def process_pending_calls(limit: int = 50):
    """
    Finds completed calls lacking AI extraction or summary and triggers processing.
    """
    logger.info(f"Querying up to {limit} unsummarized completed calls...")
    try:
        from sqlalchemy import select
        from app.db.session import AsyncSessionLocal
        from app.models.call import Call, CallStatus, CallExtraction
        from app.workers.tasks import process_completed_call

        processed_count = 0
        async with AsyncSessionLocal() as session:
            # Select completed calls that don't have an extraction record
            query = (
                select(Call.id)
                .outerjoin(CallExtraction, Call.id == CallExtraction.call_id)
                .where(Call.status == CallStatus.COMPLETED)
                .where(CallExtraction.id.is_(None))
                .limit(limit)
            )
            result = await session.execute(query)
            pending_call_ids = [row[0] for row in result.fetchall()]

        logger.info(f"Found {len(pending_call_ids)} calls needing post-processing.")
        for cid in pending_call_ids:
            try:
                # Dispatch async Celery worker task or process directly
                process_completed_call.delay(str(cid))
                processed_count += 1
            except Exception as ex:
                logger.warning(f"Failed to queue task for call {cid}: {ex}")

        logger.info(f"Dispatched {processed_count}/{len(pending_call_ids)} calls to worker queue.")
        return True
    except Exception as e:
        logger.error(f"Error during batch call processing: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="AI Call Center Batch & DevOps Runner")
    parser.add_argument(
        "--batch-type",
        required=True,
        choices=["process-calls", "migrate", "seed", "audit"],
        help="Type of batch operation to execute"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=50,
        help="Max items for batch processing (default: 50)"
    )

    args = parser.parse_args()
    logger.info(f"Starting batch runner with operation: {args.batch_type}")

    success = False
    if args.batch_type == "migrate":
        success, _ = run_migration()
    elif args.batch_type == "seed":
        success, _ = run_seed()
    elif args.batch_type == "audit":
        success = asyncio.run(run_audit())
    elif args.batch_type == "process-calls":
        success = asyncio.run(process_pending_calls(limit=args.limit))

    if success:
        logger.info(f"Batch task '{args.batch_type}' completed successfully.")
        sys.exit(0)
    else:
        logger.error(f"Batch task '{args.batch_type}' failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
