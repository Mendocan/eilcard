#!/bin/bash
set -euo pipefail

cd /opt/digital_card

if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

if [ ! -f .env.prod ]; then
  POSTGRES_PASSWORD=$(openssl rand -base64 24)
  BETTER_AUTH_SECRET=$(openssl rand -base64 32)
  cat > .env.prod <<EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
APP_DOMAIN=eilcard.com
APP_URL=https://eilcard.com
RESEND_API_KEY=
EOF
fi

docker compose -f docker-compose.prod.yml --env-file .env.prod build
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

sleep 8
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
echo "--- migrate ---"
docker compose -f docker-compose.prod.yml --env-file .env.prod logs migrate --tail 30
echo "--- app ---"
docker compose -f docker-compose.prod.yml --env-file .env.prod logs app --tail 15
