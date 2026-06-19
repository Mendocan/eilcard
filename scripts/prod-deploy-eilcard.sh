#!/bin/bash
set -euo pipefail

KEY="$HOME/.ssh/id_ed25519_eilcard"
HOST="root@209.38.35.151"
ROOT="/c/digital_card"

sed -i 's/\r$//' "$ROOT/scripts/update-deploy.sh" "$ROOT/scripts/deploy-remote.sh"

echo "==> tarball"
tar -czf /tmp/digital_card.tgz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=apps/web/.env \
  --exclude=apps/web/.env.local \
  -C "$ROOT" .

echo "==> upload"
scp -i "$KEY" /tmp/digital_card.tgz "$HOST:/root/digital_card.tgz"
scp -i "$KEY" "$ROOT/scripts/update-deploy.sh" "$ROOT/scripts/deploy-remote.sh" "$HOST:/root/"

echo "==> remote deploy"
ssh -i "$KEY" "$HOST" bash <<'REMOTE'
set -euo pipefail
sed -i 's/\r$//' /root/update-deploy.sh /root/deploy-remote.sh
bash /root/update-deploy.sh
REMOTE

echo "==> remove mistaken @eilcard registry card"
ssh -i "$KEY" "$HOST" bash <<'REMOTE'
set -euo pipefail
cd /opt/digital_card
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate node apps/web/scripts/delete-eilcard-card.mjs
REMOTE

echo "==> ensure platform operator (if user registered)"
ssh -i "$KEY" "$HOST" bash <<'REMOTE'
set -euo pipefail
cd /opt/digital_card
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate node apps/web/scripts/ensure-platform-operator.mjs || true
REMOTE

echo "==> verify"
curl -sf -o /dev/null -w "example=%{http_code}\n" "https://eilcard.com/example"
curl -sf -o /dev/null -w "eilcard-gone=%{http_code}\n" "https://eilcard.com/api/v1/resolve?handle=eilcard" || true
