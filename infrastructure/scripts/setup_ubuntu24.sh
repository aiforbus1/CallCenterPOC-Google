#!/usr/bin/env bash
# ==============================================================================
# Google Cloud VPS (Ubuntu 24.04 LTS) Server Preparation Script
# Prepares the OS, installs Docker, Docker Compose, FFmpeg, and sets up firewall.
# ==============================================================================
set -euo pipefail

echo "=============================================================================="
echo " 🚀 PREPARING GOOGLE VPS (UBUNTU 24.04 LTS) FOR AI CALL CENTER DEPLOYMENT"
echo "=============================================================================="

# Ensure running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root or with sudo: sudo bash $0"
    exit 1
fi

# Detect Ubuntu Version
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "✓ Detected OS: $NAME $VERSION_ID ($VERSION_CODENAME)"
    if [ "$ID" != "ubuntu" ]; then
        echo "⚠️ Warning: This script is optimized for Ubuntu 24.04 LTS. Proceeding anyway..."
    fi
fi

echo ""
echo "=== [1/5] Updating System Packages ==="
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

echo ""
echo "=== [2/5] Installing Required Utilities & Media Codecs ==="
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ffmpeg \
    libsndfile1 \
    ufw \
    htop \
    jq \
    certbot \
    python3-certbot-nginx

echo ""
echo "=== [3/5] Installing Official Docker CE & Docker Compose Plugin ==="
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

systemctl enable docker
systemctl start docker

# Add non-root sudo user if exists
TARGET_USER="${SUDO_USER:-$USER}"
if [ "$TARGET_USER" != "root" ]; then
    usermod -aG docker "$TARGET_USER"
    echo "✓ Added user '$TARGET_USER' to docker group"
fi

echo ""
echo "=== [4/5] Configuring Host Firewall (UFW) ==="
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP Web Portal'
ufw allow 443/tcp comment 'HTTPS Secure Web Portal'
ufw allow 8000/tcp comment 'FastAPI Backend & Mobile VoIP'
# Do not expose 5432 or 6379 publicly (they remain bound to localhost / Docker network)
ufw --force enable
ufw status verbose

echo ""
echo "=== [5/5] Checking Installed Versions ==="
docker --version
docker compose version
ffmpeg -version | head -n 1

echo ""
echo "=============================================================================="
echo " ✅ SERVER PREPARATION COMPLETE!"
echo "=============================================================================="
echo "IMPORTANT GOOGLE CLOUD PLATFORM NOTE:"
echo " Ensure your GCP VM instance has HTTP & HTTPS traffic allowed:"
echo " 1. Go to Google Cloud Console -> Compute Engine -> VM instances"
echo " 2. Click your VM -> Edit"
echo " 3. Under 'Firewalls', check BOTH:"
echo "    [✔] Allow HTTP traffic"
echo "    [✔] Allow HTTPS traffic"
echo " 4. Click Save"
echo "=============================================================================="
