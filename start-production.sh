#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PM2_BIN="$ROOT_DIR/node_modules/.bin/pm2"

API_NAME=${API_NAME:-bot-farm-api}
DASHBOARD_NAME=${DASHBOARD_NAME:-bot-farm-dashboard}
WORKER_NAME=${WORKER_NAME:-bot-farm-worker}
DASHBOARD_HOST=${DASHBOARD_HOST:-0.0.0.0}
DASHBOARD_PORT=${DASHBOARD_PORT:-3000}
ENABLE_WORKER=${ENABLE_WORKER:-1}

cd "$ROOT_DIR"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

upsert_pm2_process() {
  name=$1
  shift

  if "$PM2_BIN" describe "$name" >/dev/null 2>&1; then
    "$PM2_BIN" restart "$name" --update-env
  else
    "$PM2_BIN" start "$@"
  fi
}

require_command bun

if [ ! -x "$PM2_BIN" ]; then
  echo "Missing project PM2 binary: $PM2_BIN" >&2
  echo "Run 'bun install' first." >&2
  exit 1
fi

echo "Building workspace..."
bun run build

echo "Starting API..."
upsert_pm2_process "$API_NAME" \
  bun \
  --name "$API_NAME" \
  -- run --filter @bot-farm/server start

echo "Starting dashboard..."
upsert_pm2_process "$DASHBOARD_NAME" \
  bun \
  --name "$DASHBOARD_NAME" \
  -- run --filter @bot-farm/dashboard preview -- --host "$DASHBOARD_HOST" --port "$DASHBOARD_PORT"

if [ "$ENABLE_WORKER" = "1" ]; then
  echo "Starting worker..."
  upsert_pm2_process "$WORKER_NAME" \
    bun \
    --name "$WORKER_NAME" \
    -- run --filter @bot-farm/server start:worker
fi

"$PM2_BIN" save
"$PM2_BIN" status
