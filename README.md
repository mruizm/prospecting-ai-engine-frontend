# Prospecting Console

The frontend for [`prospecting-ai-engine-backend`](https://github.com/mruizm/prospecting-ai-engine-backend) —
a console sales engineers use to launch performance analyses against a
prospect's site, watch them run, and present the cited report on a call.

See [`docs/PLAN.md`](./docs/PLAN.md) for the product plan, screen-by-screen
breakdown, and roadmap this scaffold implements. The original mockups this
was built from live in the backend repo at `docs/ui/mockups.html`.

## Layout

This is an npm-workspaces monorepo with two packages:

- **`app/`** — the React + TypeScript SPA (Vite). Talks only to `/api/*`,
  never to the engine directly.
- **`server/`** — a small Express BFF. Holds the engine's internal
  `X-API-Key` server-side, proxies `/api/v1/*` to the engine, gates access
  behind a session cookie, and serves `app/dist` in production.

The browser never sees the engine's API key or its origin — see
[`docs/PLAN.md`](./docs/PLAN.md) §4 for why.

## Local setup

Requires the backend running locally first (see its own `README.md`).

```bash
cp .env.example .env   # fill in PROSPECTING_API_KEY to match the backend
npm install
npm run dev:server      # BFF on :4000
npm run dev              # Vite dev server on :5173, proxying /api -> :4000
```

Open `http://localhost:5173`, log in with `CONSOLE_SESSION_PASSWORD`.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server for `app/` |
| `npm run dev:server` | BFF in watch mode |
| `npm run build` | Production build of both packages |
| `npm run typecheck` | `tsc --noEmit` in both packages |
| `npm start` | Runs the built BFF, which also serves `app/dist` |

## Status

Scaffold stage — see `docs/PLAN.md` for what's implemented vs. planned.
The Dashboard screen is intentionally a backend-gap notice: the engine has
no list-analyses endpoint yet (only create and get-by-id), so there is
nothing real to list until that lands.
