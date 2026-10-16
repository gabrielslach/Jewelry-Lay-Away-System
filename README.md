# Mine Credit — jewelry layaway system

React + Vite SPA (React Router, TanStack Table) for a jewelry lay-away store: a customer storefront (browse, reserve a piece, pay in installments) and a staff admin area (orders, payments, reports, settings).

## Setup

Requires Node 20+ (`.nvmrc`).

```bash
npm install
npm run dev
```

`npm run dev` serves the app **with a mock API** (no backend needed). Use `npm run dev:live` to proxy `/api` to the real backend instead.

## Scripts

| Command                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Dev server with mock API                        |
| `npm run dev:live`     | Dev server proxying `/api` to live backend      |
| `npm run build`        | Production build to `dist`                      |
| `npm run build:pages`  | GitHub Pages build (live API, SPA 404 fallback) |
| `npm run preview`      | Preview production build                        |
| `npm run lint`         | ESLint                                          |
| `npm run format`       | Prettier write                                  |
| `npm run format:check` | Prettier check                                  |
| `npm test`             | Vitest (single run)                             |

Run `npm test` and `npm run lint` before handing off changes.

## Project layout

| Path              | Contents                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `src/pages/`      | Route-level screens (`admin/` for staff screens)                                             |
| `src/components/` | Reusable UI (Button, Modal, DataTable, badges, …); pages compose these                       |
| `src/layouts/`    | `StorefrontLayout` and `AdminLayout` shells                                                  |
| `src/services/`   | One file per API call; shared fetch in `http.js`, auth in `session.js` and `ensure*Token.js` |
| `src/lib/`        | Pure helpers (money, dates, validation, labels, table sorting)                               |
| `src/theme/`      | Design tokens, logo, icons                                                                   |
| `mock-server/`    | Vite plugin that implements the API in dev (seed data, finance, routes)                      |
| `test/`           | Vitest + Testing Library tests, mirroring `src/`                                             |

## Backend API

[`backend-api-definition.yml`](backend-api-definition.yml) is the OpenAPI 3 contract for the live backend (The Loft's own API; the frontend never calls the inventory provider directly). Check it before adding or changing a service. Key points:

- **Auth:** customer and admin are separate. `register`/`login` return `{ access_token, refresh_token, customer|admin }`; send `Authorization: Bearer <access_token>`. Access tokens last 15 minutes, refresh tokens 24 hours (`POST .../refresh`).
- **Rate limiting:** register, login and customer refresh allow 10 attempts per 15 minutes per IP; `429 { error }` must be handled separately from validation errors.
- **Roles:** `admin` has full access; `accounting` can view data and confirm/reject payments. Settings, rules, bank accounts, staff and the audit log are admin-only.
- **Dates:** ISO timestamps in UTC (Manila midnight arrives as 16:00Z the previous day); display in Asia/Manila.
- **Lay-away:** installments every 15 days, term of 1 up to the admin-set max (default 3). Payments are manual bank transfers with proof upload (multipart), confirmed by staff. Items without a peso price return 409.
- **Errors:** failures return JSON `{ error }`, including CSV export endpoints (reports and ledger).
- **Sandbox:** the `servers` URL is a sandbox and will move before go-live.

## Mock vs. live API

- Mock lives in `mock-server/` and is active for `npm run dev` and tests. When you add or change an endpoint, keep the mock in line with `backend-api-definition.yml`.
- Live backend URL is set in `vite.config.js` (`LIVE_API_BASE`, a sandbox) and `build:pages`. Services read `VITE_API_BASE`; empty means same-origin `/api`.
- Dev-only session shortcuts: `POST /api/dev/session/customer` and `/admin`.

## Testing

- Every new or changed component, page, and service needs a test under `test/`, mirroring `src/` (`src/components/Foo.jsx` → `test/components/Foo.test.jsx`). No test files beside source.
- Assert user-visible behavior (roles, labels, text), not implementation details.

## Deployment

Pushes to `main` run `.github/workflows/pages.yml`: `npm ci` → `npm run build:pages` → deploy to GitHub Pages. The build copies `index.html` to `404.html` so client-side routes work on refresh.
