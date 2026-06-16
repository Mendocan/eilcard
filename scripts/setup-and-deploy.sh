#!/bin/bash
set -euo pipefail

if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

rm -rf /opt/digital_card
mkdir -p /opt/digital_card
cd /opt/digital_card
tar -xzf /root/digital_card.tgz

POSTGRES_PASSWORD=$(openssl rand -base64 24)
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
ADMIN_PASSWORD=$(openssl rand -base64 18)
cat > .env.prod <<EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
APP_DOMAIN=eilcard.com
APP_URL=https://eilcard.com
RESEND_API_KEY=
NEXT_PUBLIC_GITHUB_URL=https://github.com/Mendocan/eilcard
EOF
echo "ADMIN_PASSWORD saved in /opt/digital_card/.env.prod (use for /admin login)"

chmod +x scripts/deploy-remote.sh
bash scripts/deploy-remote.sh
