#!/bin/bash
set -e
sudo mv /tmp/config.py /CiscoCallTranscription_Google/services/api/app/core/config.py
sudo mv /tmp/stt_corrector.py /CiscoCallTranscription_Google/services/api/app/services/stt_corrector.py
sudo mv /tmp/call_orchestrator.py /CiscoCallTranscription_Google/services/api/app/services/call_orchestrator.py
sudo mv /tmp/mobile_stream_handler.py /CiscoCallTranscription_Google/services/api/app/telephony/mobile_stream_handler.py
sudo mv /tmp/tasks.py /CiscoCallTranscription_Google/services/api/app/workers/tasks.py

if ! grep -q "OPENROUTER_STT_CORRECTOR_MODEL" /CiscoCallTranscription_Google/.env; then
    echo "OPENROUTER_STT_CORRECTOR_MODEL=google/gemma-4-26b-a4b-it" | sudo tee -a /CiscoCallTranscription_Google/.env
fi

cd /CiscoCallTranscription_Google
sudo docker compose -f docker-compose.prod.yml build api
sudo docker compose -f docker-compose.prod.yml up -d api worker
# Always restart web after api recreation so Nginx upstream DNS resolves to new container IP
sudo docker restart callcenter_web_prod
echo "DEPLOYMENT COMPLETE"
