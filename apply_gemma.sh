#!/bin/bash
set -e
sudo mv /tmp/config.py /CiscoCallTranscription_Google/services/api/app/core/config.py
sudo mv /tmp/setting.py /CiscoCallTranscription_Google/services/api/app/models/setting.py
sudo mv /tmp/schema_setting.py /CiscoCallTranscription_Google/services/api/app/schemas/setting.py
sudo mv /tmp/agent_settings_service.py /CiscoCallTranscription_Google/services/api/app/services/agent_settings_service.py
sudo mv /tmp/settings.tsx /CiscoCallTranscription_Google/apps/web/src/pages/settings.tsx

sudo sed -i 's|OPENROUTER_CHAT_MODEL=.*|OPENROUTER_CHAT_MODEL=google/gemma-4-26b-a4b-it|g' /CiscoCallTranscription_Google/.env

sudo docker exec -i callcenter_postgres_prod psql -U callcenter -d callcenterdb << 'EOF'
UPDATE agent_settings SET chat_model = 'google/gemma-4-26b-a4b-it';
SELECT chat_model, stt_model, tts_voice FROM agent_settings;
EOF
