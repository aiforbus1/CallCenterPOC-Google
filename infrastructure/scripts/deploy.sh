#!/usr/bin/env bash
# ==============================================================================
# AI Call Center Production Deployment Script
# Builds, migrates, seeds, and boots all containerized services.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${PROJECT_ROOT}"

echo "=============================================================================="
echo " 🚀 DEPLOYING AI CALL CENTER TO PRODUCTION (UBUNTU 24 / DOCKER)"
echo "=============================================================================="

# 1. Check environment file
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "⚠️ .env file not found. Creating from .env.example..."
        cp .env.example .env
        echo "❗ IMPORTANT: Please edit .env with your real credentials (OPENROUTER_API_KEY, JWT_SECRET, etc.)"
        exit 1
    else
        echo "❌ Error: Neither .env nor .env.example was found!"
        exit 1
    fi
fi

# 2. Build production container images
echo ""
echo "=== [1/5] Building Docker Containers (hoisted node_modules outside web) ==="
docker compose -f docker-compose.prod.yml build

# 3. Start PostgreSQL and Redis and wait for healthchecks
echo ""
echo "=== [2/5] Starting Database & Redis Cache ==="
docker compose -f docker-compose.prod.yml up -d postgres redis

echo "⏳ Waiting for PostgreSQL to be ready..."
until docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U callcenter -d callcenterdb > /dev/null 2>&1; do
    sleep 2
done
echo "✓ PostgreSQL is ready!"

# 4. Run Alembic Database Migrations
echo ""
echo "=== [3/5] Applying Database Migrations ==="
docker compose -f docker-compose.prod.yml run --rm api alembic upgrade head

# 5. Run Database Seeding
echo ""
echo "=== [4/5] Seeding Initial Users & Hotline Settings ==="
docker compose -f docker-compose.prod.yml run --rm -v "${PROJECT_ROOT}/scripts:/app/scripts:ro" api python /app/scripts/seed.py || {
    echo "⚠️ Seeding skipped or already populated."
}

# 6. Launch API, Worker, and Web Portal
echo ""
echo "=== [5/5] Launching All Services ==="
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "=== Checking Service Status ==="
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=============================================================================="
echo " 🎉 DEPLOYMENT SUCCESSFUL!"
echo "=============================================================================="
echo " Services:"
echo "   - Web Management Portal: http://<YOUR_VPS_IP>/"
echo "   - REST API & Docs:       http://<YOUR_VPS_IP>/api/docs"
echo "   - Health Check:          http://<YOUR_VPS_IP>/health"
echo "   - Twilio Media Stream:   ws://<YOUR_VPS_IP>/api/v1/telephony/stream/{call_id}"
echo ""
echo " Default Admin Credentials:"
echo "   Email:    admin@callcenter.poc (or admin@callcenter.local)"
echo "   Password: Admin123! (or Admin123456!)"
echo "=============================================================================="
