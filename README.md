# Bot Farm Monorepo

Monorepo for a Telegram bot farm with:

- `apps/server`: Bun + Hono backend for Telegram logic, OpenRouter calls, TypeORM-backed SQLite persistence, long polling/webhooks, and admin API
- `apps/dashboard`: TanStack React dashboard with Tailwind styling, TanStack Router, TanStack Query, and basic auth against the server admin API

## Workspace

```text
apps/
  dashboard/
  server/
docs/
compose.yaml
```

## Development

1. Configure env files:

```text
apps/server/.env
apps/dashboard/.env
```

2. Install workspace dependencies:

```bash
bun install
```

3. Run the server:

```bash
bun run dev:server
```

4. Run the dashboard:

```bash
bun run dev:dashboard
```

5. Open:

- Dashboard: `http://localhost:3000`
- Server: `http://localhost:3001`

The server now requires its admin credentials and all other runtime env vars to be explicitly set in `apps/server/.env`.

## Packages

### `apps/server`

- Bun runtime
- Hono HTTP server
- `grammy` Telegram library
- TypeORM with a SQLite-compatible `sql.js` adapter persisted to `DB_PATH`
- OpenRouter provider abstraction
- AES-256-GCM encryption for stored Telegram secrets
- Dev long polling and deployment webhook support
- Admin API protected with HTTP Basic Auth

Important env vars:

- `APP_PORT`
- `APP_BASE_URL`
- `DB_ADAPTER` (`typeorm`)
- `DB_PATH`
- `OPENROUTER_API_KEY`
- `OPENROUTER_BASE_URL`
- `DEFAULT_OPENROUTER_MODEL`
- `DEFAULT_CONTEXT_LIMIT`
- `DEV_LONG_POLLING`
- `TELEGRAM_POLL_TIMEOUT_SECONDS`
- `SECRET_ENCRYPTION_KEY`
- `DASHBOARD_ORIGIN`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

### `apps/dashboard`

- TanStack Router
- TanStack Query
- React
- Tailwind CSS

The dashboard stores the entered Basic Auth credentials in `localStorage` and sends them to the server admin API via the `Authorization` header.

## Checks

```bash
bun run check
```

This runs:

- `apps/server` TypeScript check
- `apps/dashboard` production build

## Docker

```bash
docker compose up --build
```

Services:

- `server` on port `3001`
- `dashboard` on port `3000`

The SQLite database persists in the `bot_farm_server_data` volume.

## Current Admin API

- `GET /api/health`
- `GET /api/admin/session`
- `GET /api/admin/db/status`
- `GET /api/admin/db/summary`
- `GET /api/admin/db/interactions`
- `GET /api/admin/db/bots`
- `GET /api/admin/db/bots/:id`
- `POST /api/admin/db/bots`
- `PUT /api/admin/db/bots/:id`
- `POST /api/admin/db/bots/:id/toggle`
- `POST /api/admin/bots/:id/connect`
- `POST /api/admin/bots/:id/disconnect`

## Notes

- Production Telegram webhook mode requires a public `APP_BASE_URL`.
- Local development should usually keep `DEV_LONG_POLLING=true`.
- OpenRouter credentials remain environment-only.
- Telegram bot tokens and webhook secret tokens are encrypted before being written to SQLite.
