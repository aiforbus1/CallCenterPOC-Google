# AI Call Center — Google VPS Deployment & User Guide
**Server IP**: `34.41.238.202`  
**Operating System**: Ubuntu 24.04 LTS (Noble Numbat)  
**Hotline System**: Egyptian Police 122 Emergency Dispatch AI POC  

---

## 1. User Accounts & Credentials Reference

The system comes pre-seeded and configured with the following user accounts:

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Primary Mobile Admin** | `admin122@callcenter.local` | `Admin123456789!` | **Pre-configured in Mobile App APK**. Full admin privileges, live VoIP calls, customer directory, audit reports. |
| **Local Admin** | `admin@callcenter.local` | `Admin123456!` | Full admin management on Web Console and API. |
| **POC Master Admin** | `admin@callcenter.poc` | `Admin123!` | Master administrator account. |
| **Call Operator** | `operator@callcenter.poc` | `Operator123!` | Originate calls, handle active emergency dialogues, review summaries. |
| **Auditor / Viewer** | `viewer@callcenter.poc` | `Viewer123!` | Read-only access to dashboard metrics and call records. |

---

## 2. Google Cloud Platform (GCP) Firewall Configuration

Before launching the server, ensure that Google Cloud's Virtual Private Cloud (VPC) firewall allows incoming traffic to your VM:

1. Open **[Google Cloud Console](https://console.cloud.google.com/)** > **VPC Network** > **Firewall**.
2. Ensure the following ingress rules are active for instance `34.41.238.202`:

| Port | Protocol | Source Range | Purpose |
|---|---|---|---|
| `22` | TCP | `0.0.0.0/0` | Secure Shell (SSH) Remote Management |
| `80` | TCP | `0.0.0.0/0` | Web Management Console (HTTP) |
| `443` | TCP | `0.0.0.0/0` | Secure Web Management Console (HTTPS) |
| `8000` | TCP | `0.0.0.0/0` | FastAPI REST API & Mobile Real-time WebSocket VoIP |

*(Quick Check: In Compute Engine > VM Instances > click your VM > **Edit** > ensure **Allow HTTP traffic** and **Allow HTTPS traffic** are checked).*

---

## 3. Server Deployment on Google VPS (`34.41.238.202`)

### Step 1: Connect to the Server via SSH
From your workstation terminal:
```bash
ssh ubuntu@34.41.238.202
```

### Step 2: Extract or Clone the Project
```bash
sudo mkdir -p /var/www/callcenter
sudo chown -R $USER:$USER /var/www/callcenter
cd /var/www/callcenter
```

*(If transferring from Windows, run `deploy_google_vps.bat` from your local machine, or SCP `dist/google_vps/callcenter_google_vps.tar.gz` directly).*

### Step 3: Run the Automated Ubuntu 24 OS Setup
```bash
sudo bash infrastructure/scripts/setup_ubuntu24.sh
```
This script automates:
- System updates for Ubuntu 24.04 LTS.
- Installation of FFmpeg, Libsndfile (required for Egyptian Arabic speech processing).
- Installation of official Docker CE and Docker Compose plugin.
- Host UFW firewall configuration for ports 22, 80, 443, and 8000.

### Step 4: Configure Production Environment
Copy the pre-configured Google VPS configuration:
```bash
cp .env.google-vps .env
```
*(The `.env.google-vps` file is already populated with database credentials, OpenRouter AI keys, and IP `34.41.238.202`).*

### Step 5: Launch All Production Containers
```bash
bash infrastructure/scripts/deploy.sh
```
This script will:
1. Build the production Docker containers (with hoisted node_modules).
2. Start PostgreSQL 16 & Redis 7.
3. Run Alembic database migrations.
4. Auto-seed the initial admin users and police emergency hotline settings.
5. Launch FastAPI backend, Celery background worker, and Next.js / Nginx web server.

---

## 4. Mobile Application (Android APK)

The mobile application has been compiled, pre-configured with Google VPS IP `34.41.238.202`, and signed.

### 4.1 APK Download Locations
The APK files are generated and located in:
- **Release APK (Optimized, 19.5 MB)**:  
  [dist/google_vps/app-release.apk](file:///C:/Projects/CallCenterPOC-Google/dist/google_vps/app-release.apk)
- **Debug APK (49.1 MB)**:  
  [dist/google_vps/app-debug.apk](file:///C:/Projects/CallCenterPOC-Google/dist/google_vps/app-debug.apk)

### 4.2 Installation on Android Phone / Tablet / Emulator
1. Transfer `app-release.apk` to your Android device via USB, Google Drive, WhatsApp, or direct download.
2. Tap the APK file to install.
3. If prompted, allow **"Install unknown apps"** from your file manager or browser.
4. Open **CallCenter AI (شرطة النجدة 122)**.

### 4.3 Pre-configured Login Screen
When you launch the mobile app:
- **Server URL**: Pre-filled with `http://34.41.238.202:8000/api/v1`.
- **Admin Email**: Pre-filled with `admin122@callcenter.local`.
- **Admin Password**: Pre-filled with `Admin123456789!`.
- **Quick Preset Chips**: Tap any chip to instantly switch server environments:
  - `Google VPS (Port 8000)`: `http://34.41.238.202:8000/api/v1`
  - `Google VPS Web (Port 80)`: `http://34.41.238.202/api/v1`
  - `Localhost (Emulator)`: `http://10.0.2.2:8000/api/v1`
- Tap **Sign In** to log in to the emergency dispatch console.

### 4.4 Making Real-Time In-App Voice Calls
1. From the mobile dashboard, tap **Originate Outbound Call**.
2. Enter the destination phone number or select a registered citizen/reporter.
3. Choose the dialect: **Egyptian Arabic (ar-EG)** or **English (en)**.
4. Tap **Start Call**:
   - The app connects to `ws://34.41.238.202:8000/api/v1/calls/stream/{call_id}`.
   - Speak into your microphone; the AI agent transcribes speech with Whisper Large V3 Turbo, evaluates emergency context using Gemini, and replies with low-latency Gemini Egyptian Arabic voice audio!

---

## 5. Web Management Console

Access the administrative web portal from any desktop or laptop browser:

- **Web Dashboard**: [http://34.41.238.202/](http://34.41.238.202/)
- **Interactive REST API Docs (Swagger)**: [http://34.41.238.202/api/docs](http://34.41.238.202/api/docs) or [http://34.41.238.202:8000/api/docs](http://34.41.238.202:8000/api/docs)
- **Health Check Endpoint**: [http://34.41.238.202/health](http://34.41.238.202/health)

### Web Login Credentials:
- **Email**: `admin@callcenter.local` (or `admin122@callcenter.local`)
- **Password**: `Admin123456!` (or `Admin123456789!`)

---

## 6. Verification & Troubleshooting Commands

> 📘 **Detailed Guide:** See [HEALTH_CHECK_AND_DEBUGGING.md](HEALTH_CHECK_AND_DEBUGGING.md) for a full reference of Docker, Database SQL, Redis, API cURL tests, and live log debugging.

On your Google VPS server:

```bash
# Check status of all containers
docker compose -f docker-compose.prod.yml ps

# View live API logs
docker compose -f docker-compose.prod.yml logs -f api

# View live Celery worker logs (Whisper & Gemini processing)
docker compose -f docker-compose.prod.yml logs -f worker

# Test local health endpoint inside VPS
curl -I http://localhost:8000/api/v1/health

# Restart stack if updating .env
docker compose -f docker-compose.prod.yml restart
```
