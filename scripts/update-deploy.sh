#!/bin/bash
set -euo pipefail
cd /opt/digital_card
tar -xzf /root/digital_card.tgz

if ! grep -q '^ADMIN_PASSWORD=' .env.prod 2>/dev/null; then
  ADMIN_PASSWORD=$(openssl rand -base64 18)
  echo "ADMIN_PASSWORD=${ADMIN_PASSWORD}" >> .env.prod
  echo "NEXT_PUBLIC_GITHUB_URL=https://github.com/Mendocan/eilcard" >> .env.prod
  echo "Added ADMIN_PASSWORD to .env.prod — save this password:"
  echo "${ADMIN_PASSWORD}"
fi

bash scripts/deploy-remote.sh
