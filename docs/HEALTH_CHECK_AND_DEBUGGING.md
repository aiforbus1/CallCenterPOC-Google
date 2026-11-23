# AI Call Center — Health Check & Troubleshooting Guide
# دليل فحص الصحة وتشخيص أعطال النظام

This comprehensive operational guide details all commands, procedures, and queries required to monitor, debug, and troubleshoot all components of the AI Call Center platform (Docker containers, PostgreSQL database, FastAPI backend, Celery workers, and Nginx web server).

---

## 1. Quick All-in-One Health Check Script (فحص شامل وفوري)

Run this one-liner directly on the host or VPS terminal to inspect the complete system status in 5 seconds:

```bash
echo "=== 1. DOCKER CONTAINERS STATUS ===" && \
docker compose ps && \
echo "" && \
echo "=== 2. DATABASE READINESS ===" && \
docker compose exec postgres pg_isready -U callcenter -d callcenterdb && \
echo "" && \
echo "=== 3. REDIS READINESS ===" && \
docker compose exec redis redis-cli ping && \
echo "" && \
echo "=== 4. API HEALTH ENDPOINT ===" && \
curl -s http://localhost/api/v1/health && \
echo "" && \
echo "=== 5. AI PROVIDERS HEALTH ===" && \
curl -s http://localhost/api/v1/health/providers && \
echo ""
```

---

## 2. Docker Containers Health & Resources (فحص حاويات الدوكر)

### Check Container Status & Health State
```bash
# Display all running containers and their healthcheck state (healthy / starting / unhealthy)
docker compose ps

# Detailed status with container names, ports, and uptime
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Inspect Healthcheck Details of Specific Containers
```bash
# Inspect API container healthcheck log and failure count
docker inspect --format='{{json .State.Health}}' callcenter_api_prod | jq

# Inspect PostgreSQL healthcheck details
docker inspect --format='{{json .State.Health}}' callcenter_postgres_prod | jq

# Inspect Redis healthcheck details
docker inspect --format='{{json .State.Health}}' callcenter_redis_prod | jq
```

### Real-Time Resource Usage (CPU & Memory)
```bash
# Monitor live CPU, Memory, and Network I/O for all containers
docker stats --no-stream
```

---

## 3. Live Logs Review (مراجعة السجلات الحية)

### View All Logs Combined
```bash
# Follow the last 100 lines across all services in real time
docker compose logs -f --tail=100
```

### API Backend Logs (FastAPI / Uvicorn / WebSockets)
```bash
# Follow live API logs (incoming requests, auth, WebSockets)
docker compose logs -f --tail=200 api

# Filter for errors, exceptions, and stack traces only
docker compose logs api | grep -iE "error|exception|traceback|fail|401|404|500"
```

### Background Worker Logs (Celery / Post-Call AI Tasks)
```bash
# Follow asynchronous audio processing and background extraction
docker compose logs -f --tail=200 worker
```

### Database Logs (PostgreSQL)
```bash
# View database server startup, query errors, and connection attempts
docker compose logs -f --tail=100 postgres
```

### Web & Proxy Logs (Nginx / Next.js Static Export)
```bash
# Follow HTTP access, downloads (such as 122Nagda.apk), and upstream proxy requests
docker compose logs -f --tail=100 web

# Read direct Nginx error logs inside the container
docker compose exec web cat /var/log/nginx/error.log
```

---

## 4. PostgreSQL Database Health & Diagnostic Queries (فحص قاعدة البيانات)

### Database Readiness Check (CLI)
```bash
# Ping Postgres readiness using pg_isready
docker compose exec postgres pg_isready -U callcenter -d callcenterdb
```
> **Expected output:** `callcenterdb:5432 - accepting connections`

### Connect Directly to PostgreSQL Interactive Shell
```bash
docker compose exec postgres psql -U callcenter -d callcenterdb
```

### Diagnostic SQL Queries

```sql
-- 1. Verify User Accounts and Roles
SELECT id, email, display_name, role, is_active, created_at 
FROM users 
ORDER BY created_at ASC;

-- 2. Verify AI Agent Settings & Active Models
SELECT key, stt_model, chat_model, tts_voice, vad_silence_timeout_seconds, is_active 
FROM agent_settings;

-- 3. Review Recent Emergency Calls
SELECT id, from_number, direction, status, call_mode, duration_seconds, created_at 
FROM calls 
ORDER BY created_at DESC LIMIT 5;

-- 4. Review Audio Transcriptions (Whisper Output)
SELECT id, call_id, provider, model, transcription_status, SUBSTRING(transcript_text FROM 1 FOR 60) AS preview, created_at 
FROM transcripts 
ORDER BY created_at DESC LIMIT 5;

-- 5. Review Extracted Call Data (Intent, Urgency, Department)
SELECT id, call_id, intent, priority, assigned_department, validation_status, created_at 
FROM call_extractions 
ORDER BY created_at DESC LIMIT 5;

-- 6. Check Active Connections & Running Queries
SELECT pid, usename, client_addr, state, SUBSTRING(query FROM 1 FOR 80) AS query 
FROM pg_stat_activity 
WHERE datname = 'callcenterdb';

-- 7. Database Size on Disk
SELECT pg_size_pretty(pg_database_size('callcenterdb')) AS database_size;
```

---

## 5. Redis Cache & Queue Health (فحص الكاش والمهام)

### Redis Ping Check
```bash
# Check if Redis server is responsive (returns PONG)
docker compose exec redis redis-cli ping
```

### Inspect Redis Memory & Keys
```bash
# Check memory allocation
docker compose exec redis redis-cli info memory | grep -E "used_memory_human|used_memory_peak_human"

# List Celery task queues in Redis
docker compose exec redis redis-cli keys "celery*"
```

---

## 6. Live API & AI Provider Health Endpoints (cURL Tests)

### 1. Basic Health Check (Database + Telephony + Config)
```bash
curl -s http://localhost/api/v1/health | jq
```
*Expected Response:*
```json
{
  "status": "ok",
  "database": "ok",
  "environment": "production",
  "telephony_provider": "twilio",
  "stt_model": "openai/whisper-large-v3",
  "tts_model": "hexgrad/kokoro",
  "chat_model": "google/gemini-2.5-flash"
}
```

### 2. AI Providers Connectivity Check (Whisper STT, Gemini LLM, TTS)
```bash
curl -s http://localhost/api/v1/health/providers | jq
```
*Expected Response:*
```json
{
  "status": "ok",
  "providers": {
    "stt": {"model": "openai/whisper-large-v3", "ok": true},
    "tts": {"model": "hexgrad/kokoro", "ok": true},
    "chat": {"model": "google/gemini-2.5-flash", "ok": true}
  }
}
```

### 3. Test Authentication (JWT Login)
```bash
curl -i -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@callcenter.poc","password":"Admin123!"}'
```

### 4. Test Dynamic Agent Configuration (Using JWT Token)
```bash
curl -s -H "Authorization: Bearer <ACCESS_TOKEN>" \
  http://localhost/api/v1/settings/agent | jq
```

---

## 7. Troubleshooting & Recovery Procedures (إجراءات الإصلاح السريع)

### Restart Specific Services Without Full Downtime
```bash
# Restart only the API container:
docker compose restart api

# Restart background worker:
docker compose restart worker

# Restart web/nginx:
docker compose restart web
```

### Rebuild and Apply Code Updates
```bash
# Rebuild API and Web containers after updating code:
docker compose up -d --build
```

### Reset and Reseed Default Database Accounts
If user credentials get corrupted or you need to restore default accounts:
```bash
docker compose exec api python seed.py
```

### Verify Network & Port Accessibility from Host
```bash
# Check listening ports on VPS:
netstat -tuln | grep -E ":80|:443|:8000|:5432|:6379"
```
