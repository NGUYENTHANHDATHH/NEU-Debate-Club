#!/bin/sh
# Chạy trên server sau `git pull` (GitHub Actions gọi qua SSH, xem DEPLOY.md mục CI/CD).
# Build lỗi thì `up` dừng trước khi thay container, bản cũ vẫn chạy.
set -eu
cd "$(dirname "$0")/.."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --wait --wait-timeout 600
docker image prune -f >/dev/null
DOMAIN=$(sed -n 's/^DOMAIN=//p' .env)
curl -fsS "https://$DOMAIN/api/actuator/health"
echo
git log -1 --format='deployed: %h %s'
