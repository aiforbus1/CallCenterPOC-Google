# Deploying AI Call Center POC on Google VPS (Ubuntu 24.04 LTS)

This guide provides end-to-end instructions for deploying the **AI Call Center POC** (Egyptian Police 122 Hotline) to a **Google Cloud Platform (GCP) Compute Engine VPS** running **Ubuntu 24.04 LTS (Noble Numbat)**.

---

## 1. Architecture & Monorepo Node Structure

The system consists of:
- **Web Console (Next.js 13 + Tailwind CSS)**: Compiled to an optimized static export and served through Nginx.
- **Node Dependencies Hoisting**: All Node libraries (`node_modules`) are located **outside** the `apps/web` project directory at the project root level, managed via npm workspaces (`"workspaces": ["apps/web"]`).
- **Backend API (FastAPI + Python 3.11)**: Async REST API, WebSocket media streaming for Twilio and Mobile VoIP, audio converters (`ffmpeg`).
- **Post-Call Worker (Celery 5)**: Background tasks for Whisper STT and Gemini analysis.
- **Relational Database (PostgreSQL 16)**: UUID keys, JSONB emergency reports, Alembic migrations.
- **In-Memory Cache & Broker (Redis 7)**: Celery task broker and transient call state cache.
- **Reverse Proxy & Web Server (Nginx)**: Routes port 80/443, handles WebSocket upgrades, serves static assets.

---

## 2. Google Cloud VPS Preparation

### 2.1 Create Compute Engine VM Instance
1. Go to the **[Google Cloud Console](https://console.cloud.google.com/)** > **Compute Engine** > **VM instances**.
2. Click **Create Instance**:
   - **Machine Type**: `e2-standard-2` (2 vCPU, 8 GB RAM) or minimum `e2-medium` (2 vCPU, 4 GB RAM).
   - **Boot Disk**: Click *Change* > Select **Ubuntu**, Version: **Ubuntu 24.04 LTS (x86/64)**, Size: **30 GB** (Balanced persistent disk or SSD).
   - **Firewall**: Check **Allow HTTP traffic** and **Allow HTTPS traffic**.
3. Under **Advanced options** > **Networking**:
   - Ensure external IPv4 is set to a **Static external IP address** (Reserve new static IP).
4. Click **Create**.

---

## 3. Deployment Methods

### Method A: 1-Click Deployment from Windows (`deploy_google_vps.bat`)

From your local Windows workstation:
1. Double-click `deploy_google_vps.bat` or run:
   ```cmd
   deploy_google_vps.bat
   ```
2. Select **[2] Package and Direct Deploy to Google VPS via SCP/SSH**.
3. Enter your Google VPS External IP address and SSH user (e.g. `ubuntu`).
4. The tool will:
   - Build a clean archive `dist/google_vps/callcenter_google_vps.tar.gz` (excluding node_modules and temp files).
   - Upload via SCP to your VPS.
   - Extract it into `/var/www/callcenter`.
   - Run `infrastructure/scripts/setup_ubuntu24.sh` (installs Docker, Compose, FFmpeg, UFW).
   - Run `infrastructure/scripts/deploy.sh` (builds containers, migrates DB, seeds initial data, boots services).

---

### Method B: Manual Server Setup on Ubuntu 24

#### Step 1: SSH into your Ubuntu 24 VPS
```bash
ssh ubuntu@<YOUR_VPS_EXTERNAL_IP>
```

#### Step 2: Clone or Copy the Repository
```bash
sudo mkdir -p /var/www/callcenter
sudo chown -R $USER:$USER /var/www/callcenter
cd /var/www/callcenter

# If using git:
# git clone <your-repo-url> .
```

#### Step 3: Run Server Initialization Script
```bash
sudo bash infrastructure/scripts/setup_ubuntu24.sh
```
This script:
- Updates package manager for Ubuntu 24.04 LTS.
- Installs `ffmpeg`, `libsndfile1`, `ca-certificates`, `curl`, `ufw`, `certbot`.
- Installs the official **Docker CE** and **Docker Compose plugin**.
- Configures the firewall (UFW) to allow ports 22, 80, and 443.

#### Step 4: Configure Production Environment (`.env`)
```bash
cp .env.example .env
nano .env
```
Fill in the essential variables:
```ini
# PostgreSQL credentials
POSTGRES_USER=callcenter
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD
POSTGRES_DB=callcenterdb

# Redis password
REDIS_PASSWORD=YOUR_STRONG_REDIS_PASSWORD

# Security
JWT_SECRET=GENERATE_RANDOM_SECRET_WITH_openssl_rand_hex_32

# OpenRouter AI Keys (Whisper + Gemini TTS + Emergency Reasoning)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_STT_MODEL=openai/whisper-large-v3-turbo
OPENROUTER_TTS_MODEL=google/gemini-3.8-flash-lite-tts
OPENROUTER_CHAT_MODEL=google/gemini-2.0-flash-001

# Public URL (Your VPS IP or Domain)
PUBLIC_API_BASE_URL=http://<YOUR_VPS_IP>
PUBLIC_WEB_BASE_URL=http://<YOUR_VPS_IP>
PUBLIC_MEDIA_WEBSOCKET_URL=ws://<YOUR_VPS_IP>

# Telephony Mode ('simulated' for testing / Mobile App, or 'twilio' for real PSTN calls)
TELEPHONY_PROVIDER=simulated
```

#### Step 5: Run Automated Deployment
```bash
bash infrastructure/scripts/deploy.sh
```

---

## 4. Node Library Structure

To keep the application frontend clean and separated from dependencies:
1. `apps/web/node_modules/` has been moved to the root `/node_modules`.
2. The root `package.json` configures npm workspaces:
   ```json
   {
     "name": "callcenter-poc-google",
     "private": true,
     "workspaces": [
       "apps/web"
     ],
     "scripts": {
       "dev": "npm run dev --workspace=apps/web",
       "build": "npm run build --workspace=apps/web",
       "start": "npm run start --workspace=apps/web"
     }
   }
   ```
3. During local development or Docker builds:
   - Run `npm install` from the **root directory**.
   - Build using `npm run build` from the root directory or inside `apps/web`.
   - Node resolves packages up the directory tree to `/node_modules` automatically.

---

## 5. Domain Name & Free SSL Certificate (HTTPS)

If you have a domain name (e.g. `callcenter.example.com`):
1. In your DNS provider, create an **A Record** pointing `callcenter.example.com` to your Google VPS External IP.
2. Update `.env`:
   ```ini
   PUBLIC_API_BASE_URL=https://callcenter.example.com
   PUBLIC_WEB_BASE_URL=https://callcenter.example.com
   PUBLIC_MEDIA_WEBSOCKET_URL=wss://callcenter.example.com
   ```
3. Run Certbot to generate SSL certificates:
   ```bash
   sudo certbot certonly --standalone -d callcenter.example.com
   ```
4. Mount the certificates into Nginx or configure host Nginx reverse proxy.

---

## 6. Verification & Useful Management Commands

### Check running containers:
```bash
docker compose -f docker-compose.prod.yml ps
```

### View real-time logs:
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service (api or worker)
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f worker
```

### Accessing the Web Management Console:
- Open `http://<YOUR_VPS_IP>/` in your browser.
- **Default Admin Account**:
  - Email: `admin@callcenter.poc` (or `admin@callcenter.local`)
  - Password: `Admin123!` (or `Admin123456!`)
- **Interactive REST API Docs**:
  - `http://<YOUR_VPS_IP>/api/docs`
