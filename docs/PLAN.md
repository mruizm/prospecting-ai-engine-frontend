# UI development plan — Prospecting Console

A frontend for [`prospecting-ai-engine-backend`](https://github.com/mruizm/prospecting-ai-engine-backend),
used by sales engineers and solutions consultants to launch performance
analyses against a prospect's site and present the cited, evidence-grounded
report on a call. This repo is that frontend's home going forward.

Adapted from the original plan and mockups produced in the backend repo at
`docs/ui/PLAN.md` and `docs/ui/mockups.html`, grounded in the backend's
`README.md`, `src/prospecting_engine/api/performance.py`, and
`src/prospecting_engine/schemas.py`.

## 1. Users and jobs

| User | Job to be done |
|---|---|
| Sales engineer / SC | Kick off an analysis before a call, watch it progress, pull talking points and evidence into the conversation |
| Account executive | Skim the executive summary and opportunities for a prospect without reading raw evidence |
| Eng/ops (internal) | Spot failed or stuck analyses, see warnings and error codes, gauge capability coverage |

## 2. Screens

1. **Dashboard** (`/`) — recent analyses across the team, status at a glance, quick stats, entry point to a new analysis.
2. **New analysis** (`/new`) — `company_name`, `url`, `preset_id` (from `GET /presets`), optional `wpt_test_id` for reusing an existing WebPageTest run.
3. **Analysis detail** (`/analyses/:id`) — the `AnalysisStatus` lifecycle as a stepper, per-`TestRun` cards, the five `CapabilityRun`s, the `AnalysisEvent` timeline, and any `warnings`/`error_code`/`error_message`. Polls until terminal.
4. **Report** (`/analyses/:id/report`) — executive summary, narrative, `findings` (filterable by priority/statement type, each with its evidence citations), `prioritized_opportunities`, `talking_points`, `coverage`, methodology, and the evidence appendix.

No separate screen for presets or capability config in v1 — that's operational configuration (`config/*.json`), not a sales-facing concern.

## 3. Shared analysis workspace

The backend now exposes the compact history endpoint:

```
GET /v1/performance/analyses?status=&query=&created_from=&created_to=&limit=&cursor=
```

It is cursor-paginated, newest first, and uses the same authentication as the
rest of the API. Dashboard and sidebar history are therefore shared across
browsers and users of the console rather than stored in browser `localStorage`.
The dashboard persists filters in query parameters and polls only while visible
results contain non-terminal analyses.

## 4. Tech stack

- **SPA, not SSR.** Internal, API-key-gated tool, no SEO surface — Angular +
  TypeScript using standalone components and Angular Router.
- **Data fetching:** a typed Angular service backed by `fetch`. Page components
  schedule polling while responses are non-terminal, and cancel timers when
  destroyed or once status is `completed`, `completed_partial`, or `failed` —
  mirroring the engine's own adaptive polling philosophy.
- **Components:** PrimeNG 20 provides accessible interaction primitives. An
  application-owned Aura preset maps them to the product palette, density, and
  light/dark surfaces. Reusable application states live in
  `app/src/app/ui/components`; product layout and report visualizations remain
  application-owned rather than depending on PrimeNG internals.
- **Charts:** hand-rolled SVG/CSS (resource-composition bars). Nothing here
  needs a charting library.
- **Auth / API key handling:** `server/` is a BFF that holds the engine's
  `X-API-Key` server-side and proxies `/api/v1/*`. The browser never sees
  the key or talks to the engine's origin directly — see `server/README.md`.
  Its session gate is a placeholder shared password; swap for real SSO
  before wider rollout (open question below).
- **Hosting:** the BFF serves the built SPA in production — one origin, no
  CORS story.

## 5. Polling and state mapping

The detail screen re-fetches `GET /analyses/{id}` on an interval while
`status` is non-terminal, and stops on `completed`, `completed_partial`, or
`failed`. `report_url` is `null` until a report exists; `GET .../report`
returns `425` until then (shown as "not ready yet", not an error) and `409`
when a failed analysis has no report (shown as the failure state with
`error_code` / `error_message`).

## 6. Roadmap

- **Phase 0 (done):** mockups + plan (backend repo `docs/ui/`).
- **Phase 1 (this scaffold):** app + BFF scaffold, design tokens/component
  primitives, typed API client, New Analysis wired to `POST /analyses` and
  `GET /presets`, Analysis Detail wired to `GET /analyses/{id}` with
  polling, and Report wired to `GET /analyses/{id}/report`.
- **Angular migration (done):** replace the React/Vite client with Angular
  standalone components while preserving the BFF contract, screen routes,
  lifecycle polling, browser-local recents, and report behavior.
- **Phase 2 (done):** compact list endpoint, shared server-backed dashboard and
  sidebar, URL-persisted filters, cursor pagination, summary metrics, selective
  polling, and hardened loading/empty/error states.
- **PrimeNG migration (done):** standardized forms, actions, messages, cards,
  tables, status indicators, progress, lifecycle/event views, and report
  disclosure controls; introduced reusable UI states, application theming, and
  lazy page routes.
- **Phase 3 (done):** copy actions for report summaries, individual findings,
  and talking points; filterable finding accordion; evidence appendix and
  loading/empty/error-state polish.
- **Phase 4:** recovery actions for failed or partial analyses, confirmation
  flows for destructive operations, and operator-facing retry diagnostics.
- **Phase 5 (stretch):** shareable read-only report link for prospects/AEs,
  PDF export, saved/starred analyses, real SSO, org-wide dashboard filters.

## 7. Open questions for the backend team

- Who owns the list-endpoint addition, and does it need per-user scoping
  (an SE's own analyses vs. everyone's), or is the whole team one shared list?
- Should the BFF or the engine own auth for the sales team, or is there an
  existing SSO provider this should sit behind?
- Any objection to a lightweight polling model on the client vs. adding
  server push (SSE/websocket) later? Polling is proposed for v1 since the
  coordinator itself is poll-based internally, and analyses are short-lived
  (minutes, not hours).
