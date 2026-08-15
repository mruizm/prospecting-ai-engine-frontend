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

## 3. Known backend gap

**There is no list/search endpoint for analyses.** The engine API exposes
`POST /analyses`, `GET /analyses/{id}`, `GET /analyses/{id}/report`, and
`GET /presets` only — nothing enumerates past analyses. The Dashboard screen
in this scaffold reflects that honestly: it renders the gap as a visible
notice rather than fabricated data.

Proposed addition, small and additive:

```
GET /v1/performance/analyses?status=&company_name=&limit=&cursor=
```

Cursor-paginated, newest first, same auth as the rest of the router. Until
it lands, the Dashboard can only ever show analyses this browser session
itself created (kept client-side), which is what the scaffold does.

## 4. Tech stack

- **SPA, not SSR.** Internal, API-key-gated tool, no SEO surface — React +
  TypeScript on Vite.
- **Data fetching:** TanStack Query. `refetchInterval` is a function of the
  last response's `status`: fast while non-terminal, off once `completed`,
  `completed_partial`, or `failed` — mirroring the engine's own adaptive
  polling philosophy.
- **Components:** hand-built against the token system in `app/src/styles`,
  ported from the mockup — the four-screen surface here doesn't justify a
  component kit yet. Revisit if the surface grows (Radix primitives are the
  natural next step for a dialog/combobox/tooltip need).
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
  polling, Report wired to `GET /analyses/{id}/report`. Dashboard shows the
  backend-gap notice plus any analyses created this session.
- **Phase 2:** the list endpoint (backend) + a real Dashboard against it;
  warnings/error states hardened against live data instead of fixtures.
- **Phase 3:** "copy talking points" action, evidence appendix polish,
  loading/empty states audited against real latency.
- **Phase 4 (stretch):** shareable read-only report link for prospects/AEs,
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
