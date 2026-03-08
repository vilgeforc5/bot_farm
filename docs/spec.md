# Monorepo Spec

## Goal

Split the project into two packages:

- `apps/server`: Telegram + LLM backend
- `apps/dashboard`: operator UI

## Server Package

Responsibilities:

- Receive Telegram webhook updates
- Run long polling in development
- Persist bots, conversations, messages, and usage
- Execute strategy-driven LLM flows
- Call OpenRouter
- Expose authenticated admin APIs for the dashboard

Current stack:

- Bun
- Hono
- grammy
- TypeORM
- SQLite
- Zod

Admin auth:

- HTTP Basic Auth
- Configured by `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Intended as a simple first pass, not the final auth model

## Dashboard Package

Responsibilities:

- Authenticate against the server admin API
- Show bot inventory and statistics
- Create and edit bots
- Trigger webhook connect/disconnect and activation toggles
- Display recent interactions

Current stack:

- React
- TanStack Router
- TanStack Query
- Tailwind CSS
- Vite

Auth model:

- User enters server URL, username, and password
- Dashboard verifies with `GET /api/admin/session`
- Credentials are stored in browser `localStorage`
- Queries and mutations send Basic Auth in the `Authorization` header

## Deployment

Docker services:

- `server`
- `dashboard`

Persistence:

- SQLite data lives in Docker volume `bot_farm_server_data`

Secrets:

- `OPENROUTER_API_KEY` stays in env only
- Telegram bot token and Telegram secret token are encrypted at rest in SQLite

## Next Likely Steps

- Replace Basic Auth + localStorage with a real session-based auth system
- Extract shared API types into `packages/shared`
- Add conversation detail pages in the dashboard
- Add model/provider policy per strategy
- Add stronger production deployment story for the dashboard than Vite preview
