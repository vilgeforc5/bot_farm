# Deployment

## Do this now

You already have the cert generated. On the server, run:

```sh
git pull
./migrate-to-docker.sh
```

That's it. It stops PM2, moves the existing database into Docker, builds the images, and starts everything. Once it's up, open the dashboard at `http://109.73.193.125:3000`, go to each bot, and click **Connect** — this registers the webhook with Telegram so it starts sending updates to your server instead of you polling.

---

Docker Compose on `109.73.193.125`. Ports needed: **443** (webhooks + API), **3000** (dashboard).

## First deploy

```sh
# 1. Generate self-signed TLS cert (one-time)
./generate-cert.sh 109.73.193.125

# 2. Build and start
docker compose up -d --build

# 3. In the dashboard → Connect each bot (registers webhook with Telegram)
```

## Migrating from PM2

If you previously ran via PM2 and have existing data:

```sh
./generate-cert.sh 109.73.193.125   # if not done yet
./migrate-to-docker.sh              # stops PM2, copies DB into Docker volume, starts compose
```

## Updating after code changes

```sh
git pull
docker compose up -d --build
```

## Services

| Service   | What it does                            |
|-----------|-----------------------------------------|
| server    | Hono API on port 3001 (internal only)   |
| dashboard | Vite SPA on port 3000                   |
| nginx     | SSL termination on port 443 → server    |

## Architecture

```
Browser / Telegram
       │
       ▼
  nginx :443  (TLS — self-signed cert uploaded to Telegram)
       │
       ▼
  server :3001  (Hono, webhooks at /webhooks/telegram/:slug)
       │
       ▼
  SQLite (Docker volume: bot_farm_server_data)
```

## Webhook flow

1. `APP_BASE_URL=https://109.73.193.125` in `.env`
2. `DEV_LONG_POLLING=false` — no polling, Telegram pushes updates
3. Hit **Connect** in the dashboard per bot — calls `setWebhook` and uploads `cert.pem`
4. Telegram POSTs to `https://109.73.193.125/webhooks/telegram/<slug>`

## .env reference (`apps/server/.env`)

```env
APP_PORT=3001
APP_BASE_URL=https://109.73.193.125
DB_ADAPTER=typeorm
DB_PATH=./data/bot-farm.sqlite
OPENROUTER_API_KEY=<key>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEFAULT_OPENROUTER_MODEL=openrouter/free
DEFAULT_CONTEXT_LIMIT=300
DEV_LONG_POLLING=false
TELEGRAM_POLL_TIMEOUT_SECONDS=15
SECRET_ENCRYPTION_KEY=<random 32+ chars>
DASHBOARD_ORIGIN=http://109.73.193.125:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong password>
WEBHOOK_CERT_PATH=/app/certs/cert.pem
```

> `SECRET_ENCRYPTION_KEY` encrypts stored bot tokens — never change it after bots are created
> or their tokens will be unreadable.
