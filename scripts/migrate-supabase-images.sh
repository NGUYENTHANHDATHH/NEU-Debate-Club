#!/bin/sh
# Chép ảnh cũ từ Supabase Storage vào MinIO (bucket "media"). Chạy 1 lần SAU khi deploy migration V32.
# Chạy lại an toàn: ảnh đã có trong MinIO thì bỏ qua.
#   Server: scripts/migrate-supabase-images.sh
#   Dev:    DC="docker compose" scripts/migrate-supabase-images.sh
set -eu
cd "$(dirname "$0")/.."
DC=${DC:-docker compose -f docker-compose.yml -f docker-compose.prod.yml}
SUPABASE=https://lzefoyqkqqppbsyzmmuw.supabase.co/storage/v1/object/public

# Mọi đường dẫn /media/... đang được dùng (V32 đã đổi URL Supabase thành /media/...).
PATHS=$($DC exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "
  SELECT DISTINCT m[1] FROM (
    SELECT regexp_matches(t, '\''/media/([A-Za-z0-9._/-]+)'\'', '\''g'\'') AS m FROM (
      SELECT image_url AS t FROM projects
      UNION ALL SELECT image_url FROM achievements
      UNION ALL SELECT content_json::text FROM landing_content
      UNION ALL SELECT content_json::text FROM landing_content_versions
    ) s WHERE t IS NOT NULL
  ) x"')

$DC exec -T minio sh -c 'mc alias set ndc http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null'

for p in $PATHS; do
  if $DC exec -T minio mc stat "ndc/media/$p" >/dev/null 2>&1; then
    echo "có rồi: $p"
  # mc cp đoán Content-Type từ đuôi file (mc pipe thì không)
  elif curl -fsS "$SUPABASE/$p" | $DC exec -T minio sh -c \
      'f="/tmp/$(basename "$1")"; cat > "$f" && mc cp -q "$f" "ndc/media/$1" >/dev/null; s=$?; rm -f "$f"; exit $s' _ "$p"; then
    echo "đã chép: $p"
  else
    echo "LỖI: $p (không tải được từ Supabase)" >&2
  fi
done
