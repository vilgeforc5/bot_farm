# Deployment Guide

This guide covers deploying bot-farm on a VPS with Telegram webhooks (no long polling).

## Prerequisites

- Ubuntu/Debian VPS with a public IP (e.g. `109.73.193.125`)
- `bun`, `docker`, and `openssl` installed
- Ports **443** and **3000** open in the firewall

---

## 1. Generate a self-signed TLS certificate

Telegram requires HTTPS for webhooks. Run this once on the server:

```sh
./generate-cert.sh 109.73.193.125
```

This writes `nginx/certs/cert.pem` (public cert) and `nginx/certs/key.pem` (private key).

> If you ever get a real domain + Let's Encrypt cert, put the cert/key at the same paths
> and set `WEBHOOK_CERT_PATH=` (empty) in the server `.env` so the cert is not uploaded to Telegram.

---

## 2. Configure `apps/server/.env`

```env
APP_PORT=3001
APP_BASE_URL=https://109.73.193.125   # public HTTPS URL — no trailing slash
DB_ADAPTER=typeorm
DB_PATH=./data/bot-farm.sqlite
OPENROUTER_API_KEY=<your key>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEFAULT_OPENROUTER_MODEL=openrouter/free
DEFAULT_CONTEXT_LIMIT=300
DEV_LONG_POLLING=false                # disable long polling — use webhooks
TELEGRAM_POLL_TIMEOUT_SECONDS=25
SECRET_ENCRYPTION_KEY=<random 32+ chars>
DASHBOARD_ORIGIN=http://109.73.193.125:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong password>
WEBHOOK_CERT_PATH=/app/certs/cert.pem # path inside the server process to the public cert
```

---

## 3. Start the server

```sh
bun install
./start-production.sh
```

This starts three PM2 processes (API, dashboard, worker) and launches nginx in Docker on port 443.
nginx proxies `https://109.73.193.125` → `localhost:3001`.

---

## 4. Register webhooks per bot

For every bot in the dashboard, click **Connect** (or call `POST /api/admin/bots/:id/connect`).
This tells Telegram to POST updates to `https://109.73.193.125/webhooks/telegram/<slug>`
and uploads the self-signed certificate so Telegram trusts it.

You only need to do this once per bot, or again after changing `APP_BASE_URL`.

---

## How it works

```
Telegram  →  HTTPS 443  →  nginx (SSL termination)  →  HTTP 3001  →  Hono server
                                                                       /webhooks/telegram/:slug
```

- Long polling is disabled (`DEV_LONG_POLLING=false`)
- Each bot's webhook URL is `APP_BASE_URL/webhooks/telegram/<slug>`
- The secret token in `X-Telegram-Bot-Api-Secret-Token` header prevents spoofed requests

---

## Updating after code changes

```sh
git pull
./start-production.sh   # rebuilds and restarts PM2 processes; nginx is unaffected
```

---

## Docker-only deployment (alternative)

If you prefer to run everything in Docker instead of PM2:

```sh
# First time: generate cert (same as above)
./generate-cert.sh 109.73.193.125

# Set apps/server/.env as described in step 2

# Start all services
docker compose up -d --build
```

Then do step 4 (Connect each bot) the same way.
