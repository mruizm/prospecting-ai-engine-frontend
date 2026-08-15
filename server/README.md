# server — Prospecting Console BFF

A small Express backend-for-frontend. Two jobs:

1. **Hold the engine's `X-API-Key` server-side.** The browser only ever
   talks to `/api/*` on this server; `proxy.ts` forwards those requests to
   `PROSPECTING_ENGINE_URL`, attaching the key itself. The key never
   reaches client JavaScript.
2. **Gate access** behind a session cookie (`auth.ts`). Today that's one
   shared password (`CONSOLE_SESSION_PASSWORD`) — a placeholder until the
   team wires up real SSO (see `docs/PLAN.md` §7). Nothing outside
   `auth.ts` depends on how the session gets established.

In production it also serves the built SPA from `app/dist`, so the whole
console is one origin with no CORS configuration needed.

## Routes

| Route | Auth | Does |
|---|---|---|
| `GET /healthz` | none | liveness check |
| `POST /auth/login` | none | `{ password }` → session cookie or `401` |
| `POST /auth/logout` | none | clears the session |
| `GET /auth/session` | none | `{ authenticated: boolean }` |
| `ALL /api/*` | session | proxied to the engine at the matching `/*` path |

`/api/v1/performance/analyses` therefore reaches the engine's
`/v1/performance/analyses`, and so on for every route the engine exposes.

## Deploying behind a reverse proxy

The session cookie is `secure` (HTTPS-only) whenever `NODE_ENV=production`.
If this server sits behind something that terminates TLS for it (nginx, an
ALB, Cloud Run, etc.), set `TRUST_PROXY` (see `.env.example`) so Express
reads `X-Forwarded-Proto` correctly. Skip that and every login will look
like it succeeds — `POST /auth/login` returns `204` — but no cookie ever
gets set: the underlying `cookies` package refuses to send a `secure`
cookie over what it believes is a plaintext connection, and `cookie-session`
swallows that error rather than surfacing it. The symptom is a login that
silently doesn't stick; `GET /auth/session` keeps reporting
`authenticated: false` right after a "successful" login.
