# Prospecting Console

The frontend for [`prospecting-ai-engine-backend`](https://github.com/mruizm/prospecting-ai-engine-backend) —
a console sales engineers use to launch performance analyses against a
prospect's site, watch them run, and present the cited report on a call.

See [`docs/PLAN.md`](./docs/PLAN.md) for the product plan, screen-by-screen
breakdown, and roadmap this scaffold implements. The original mockups this
was built from live in the backend repo at `docs/ui/mockups.html`.

## Layout

This is an npm-workspaces monorepo with two packages:

- **`app/`** — the Angular + TypeScript SPA. It uses standalone components
  and talks only to `/api/*`,
  never to the engine directly.
- **`server/`** — a small Express BFF. Holds the engine's internal
  `X-API-Key` server-side, proxies `/api/v1/*` to the engine, gates access
  behind a session cookie, and serves `app/dist` in production.

The browser never sees the engine's API key or its origin — see
[`docs/PLAN.md`](./docs/PLAN.md) §4 for why.

## Local setup

Requires Node 20.19–24 (the repository pins Node 24.19 in `.nvmrc`) and the
backend running locally first (see its own `README.md`). Node 25+ is not
supported by the Angular 20 toolchain.

```bash
cp .env.example .env   # fill in PROSPECTING_API_KEY to match the backend
npm install
npm run dev:server      # BFF on :4000
npm run dev              # Angular dev server on :4200, proxying /api and /auth -> :4000
```

Open `http://localhost:4200`, log in with `CONSOLE_SESSION_PASSWORD`.
Both development processes must remain running: Angular on port 4200 and the
BFF on port 4000. The password is not `PROSPECTING_API_KEY`; that separate key
is used only for authenticated BFF-to-engine requests.

The BFF loads `.env` from the repository root even though npm executes its
workspace script from `server/`. Shell/container environment variables take
precedence. Set `DOTENV_CONFIG_PATH` only when an alternative env-file location
is intentionally required.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Angular development server for `app/` |
| `npm run dev:server` | BFF in watch mode |
| `npm run build` | Production build of both packages |
| `npm run typecheck` | `tsc --noEmit` in both packages |
| `npm start` | Runs the built BFF, which also serves `app/dist` |

## Angular application structure

The Angular SPA is organized by responsibility under `app/src/app/`:

- `core/` — API access, authentication guard, the shared server-backed analysis
  workspace, and server communication.
- `layout/` — authenticated application shell, navigation, theme switching,
  and sign-out.
- `pages/` — dashboard, new analysis, live analysis detail, report, and login.
- `shared/` — status chips, lifecycle stepper, run cards, and event timeline.
- `ui/components/` — reusable page headers and loading, empty, and error states.
- `ui/theme/` — the PrimeNG design preset and persisted light/dark/system theme
  service.
- `app.routes.ts` — route definitions and the authenticated route boundary.

The application uses Angular's native zoneless change detection. State exposed
to templates is held in signals, so no `zone.js` browser runtime is required.

The development proxy is in `app/proxy.conf.json`. Production output remains
`app/dist`, so the existing Express BFF continues to serve the SPA without a
deployment-path change.

## UI component system

The SPA uses PrimeNG 20, PrimeIcons, and an application-owned preset based on
PrimeNG Aura. Global setup is in `app/src/main.ts`; the semantic theme preset is
in `app/src/app/ui/theme/prospecting-preset.ts`. Product layout tokens remain in
`app/src/styles/tokens.css`, while `global.css` contains only application layout
and report-specific presentation.

Use PrimeNG for standard controls and interaction behavior:

| UI concern | Standard component |
|---|---|
| Actions | `p-button` |
| Text, password, selection, and dates | `pInputText`, `p-password`, `p-select`, `p-datepicker`, `p-radiobutton` |
| Data lists and progress | `p-table`, `p-progressbar`, `p-progress-spinner` |
| Status and counts | `p-tag`, `p-badge` |
| Containers and disclosure | `p-card`, `p-accordion` |
| Lifecycle and events | `p-stepper`, `p-timeline` |
| Feedback | `p-message`, `p-toast` |

Before adding page-local loading, empty, error, status, or heading markup,
reuse the components in `ui/components/` and `shared/status-chip.component.ts`.
Application routes are lazy-loaded with `loadComponent`, so page-specific
PrimeNG modules are excluded from the initial route bundle where possible.

## Migration milestone summary

**Angular migration (completed):** replaced React, React Router, TanStack
Query, and Vite with Angular standalone components and Angular Router. The
existing BFF security boundary and all user workflows were preserved:
authentication, analysis creation, adaptive status/report polling, WebPageTest
ID reuse, recent-analysis storage, diagnostics progress, and evidence-grounded
report presentation.

**Root environment loading (completed):** the BFF now resolves the documented
root `.env` consistently in development and from compiled `server/dist`, fixing
missing-variable errors caused by npm workspace working-directory behavior.

**Zoneless runtime configuration (completed):** Angular bootstrap now explicitly
enables zoneless change detection, matching the signal-based application state
and removing the implicit `zone.js` runtime requirement.

**Login diagnostics (completed):** verified password and session-cookie behavior
both directly and through Angular's development proxy. The login screen now
distinguishes an incorrect password from an unavailable BFF or another server
error instead of reporting every failure as a password rejection.

**Shared analysis workspace (completed):** replaced browser-local analysis
history and per-row detail requests with the backend's compact, cursor-paginated
history API. Dashboard search, status/date filters, summary metrics, selective
polling, and “Load more” pagination now operate on persisted team-wide data.
Filters are represented in the URL, and the sidebar uses the same server-backed
history rather than `localStorage`.

**PrimeNG design-system migration (completed):** standardized controls,
feedback, status presentation, data tables, cards, accordions, progress,
steppers, and timelines on PrimeNG 20. Added a reusable UI state layer, an
application-owned Aura preset, PrimeIcons, persisted system/light/dark themes,
global toast notifications, and lazy-loaded page components. Removed the
superseded custom button, card, chip, spinner, toast, table, stepper, and
accordion styling while preserving the application-specific shell and report
visualizations.

**Report responsive-layout refinement (completed):** rebalanced the findings
and opportunities columns, constrained grid children to the available width,
and made long finding and evidence values wrap safely. The report now stacks
the sidebar sooner on narrower screens instead of creating page-level
horizontal scrolling.

**Analysis-card overflow refinement (completed):** constrained test and
capability cards to their grid columns and enabled safe wrapping for long
WebPageTest IDs, status messages, and agent errors.

**Evidence appendix alignment (completed):** standardized evidence-group
headers so every record count occupies the same right-aligned column.

**Executive-summary typography (completed):** improved report readability with
justified summary and narrative text, balanced line length, natural hyphenation,
and more consistent paragraph spacing.

## Status

The shared workspace, analysis creation/progress, report presentation, and
PrimeNG component-system migration are implemented. See `docs/PLAN.md` for the
remaining recovery and product-expansion work.
