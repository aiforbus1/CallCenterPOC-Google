# AI Call Center — System Administration & Operations Guide

This guide provides essential commands and procedures for connecting to the production server, monitoring live AI call flows, verifying system health, and querying recent call records.

---

## 1. Server Access (SSH)

Connect to the production server from your local machine using your private SSH key:

```bash
ssh -i "Keys/putty-pK.openssh" rsa-key-20261118@34.41.238.202
```

> **Note:** Ensure your key file (`putty-pK.openssh`) has restricted permissions (`chmod 400 Keys/putty-pK.openssh`) if connecting from a Unix-based terminal.

---

## 2. Live Call Monitoring

### Full Real-Time Logs (Recommended for Testing)
Stream the last 50 log lines and follow live activity across the entire pipeline (incoming call connection, audio ingestion, Whisper transcription, Gemini AI response generation, and Text-to-Speech synthesis):

```bash
sudo docker logs -f --tail=50 callcenter_api_prod
```

*Press `Ctrl + C` at any time to exit the live log stream.*

### Filtered Conversation Flow (Orchestrator & AI Pipeline)
Filter out routine HTTP traffic to focus exclusively on the dialogue state, questions, and AI processing stages:

```bash
sudo docker logs -f callcenter_api_prod | grep -E "orchestrator|mobile_stream|TTS|Whisper|question"
```

---

## 3. System Health & Container Review

### Verify Running Docker Containers
Check the status and port bindings of all active containers:

```bash
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Confirm that the following **three core containers** are up and running:

| Container Name | Role | Port / Notes |
| :--- | :--- | :--- |
| **`callcenter_api_prod`** | Core API & AI Orchestration Server | Exposed on Port `8000` |
| **`callcenter_postgres_prod`** | Primary Relational Database | Stores call logs, statuses, and summaries |
| **`callcenter_redis_prod`** | In-Memory Cache & Session Store | Manages real-time call state |

### API & Database Health Check
Verify that the API service is responsive and properly connected to the database:

```bash
curl -s http://localhost:8000/api/v1/health | jq .
```

### Server Resource Utilization
Take a real-time snapshot of CPU and memory consumption across all containers:

```bash
sudo docker stats --no-stream
```

---

## 4. Database Inspection (Recent Call Records)

Query the PostgreSQL database directly to inspect the 5 most recent calls, their completion status, and a truncated preview of their AI-generated summaries:

```bash
sudo docker exec -i callcenter_postgres_prod psql -U callcenter -d callcenterdb -c "SELECT id, status, left(ai_summary, 100) AS summary, created_at FROM calls ORDER BY created_at DESC LIMIT 5;"
```