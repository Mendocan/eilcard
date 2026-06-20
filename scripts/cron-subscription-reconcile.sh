#!/usr/bin/env bash
# Daily subscription grace / downgrade reconcile for EIL Card production.
# Install on VPS: crontab -e
#   0 3 * * * /opt/digital_card/scripts/cron-subscription-reconcile.sh >> /var/log/eilcard-cron.log 2>&1

set -euo pipefail

APP_URL="${APP_URL:-https://eilcard.com}"
ENV_FILE="${ENV_FILE:-/opt/digital_card/.env.prod}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "$(date -Iseconds) ERROR: missing $ENV_FILE"
  exit 1
fi

CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r' || true)"
if [[ -z "$CRON_SECRET" ]]; then
  echo "$(date -Iseconds) ERROR: CRON_SECRET not set in $ENV_FILE"
  exit 1
fi

response="$(curl -fsS -X POST \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  "${APP_URL}/api/cron/subscription-reconcile")"

echo "$(date -Iseconds) OK ${response}"
