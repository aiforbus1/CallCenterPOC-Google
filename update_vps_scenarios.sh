#!/bin/bash
set -e
sudo mv /tmp/call_orchestrator.py /CiscoCallTranscription_Google/services/api/app/services/call_orchestrator.py

# Copy migration script into container and run it
sudo docker cp /tmp/build_scenarios.py callcenter_api_prod:/app/build_scenarios.py
sudo docker cp /tmp/apply_20_scenarios_to_db.py callcenter_api_prod:/app/apply_20_scenarios_to_db.py
sudo docker exec callcenter_api_prod python /app/apply_20_scenarios_to_db.py

# Rebuild and restart API
cd /CiscoCallTranscription_Google
sudo docker compose -f docker-compose.prod.yml build api
sudo docker compose -f docker-compose.prod.yml up -d api worker

# Wait 3s then restart web so Nginx upstream updates
sleep 3
sudo docker restart callcenter_web_prod
echo "20 SCENARIOS APPLIED AND TESTED"
