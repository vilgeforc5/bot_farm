#!/bin/sh
# One-time migration from PM2 to Docker Compose.
# Stops PM2 processes, copies existing SQLite data into the Docker volume, then starts everything.

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$ROOT_DIR"

PM2_BIN="$ROOT_DIR/node_modules/.bin/pm2"
DATA_DIR="$ROOT_DIR/apps/server/data"

echo "==> Stopping PM2 processes (if any)..."
if [ -x "$PM2_BIN" ]; then
  "$PM2_BIN" stop all 2>/dev/null || true
  "$PM2_BIN" delete all 2>/dev/null || true
fi

echo "==> Building Docker images..."
docker compose build

echo "==> Migrating SQLite data to Docker volume..."
docker compose run --rm --no-deps \
  -v "$DATA_DIR:/migration:ro" \
  --entrypoint sh server -c "
    if ls /migration/*.sqlite 2>/dev/null | head -1 | grep -q .; then
      cp -v /migration/bot-farm.sqlite /app/data/
      cp -v /migration/bot-farm.sqlite-shm /app/data/ 2>/dev/null || true
      cp -v /migration/bot-farm.sqlite-wal /app/data/ 2>/dev/null || true
      echo 'Data migrated.'
    else
      echo 'No existing data found — starting with an empty database.'
    fi
  "

echo "==> Starting all services..."
docker compose up -d

echo ""
echo "Done! Services:"
docker compose ps
