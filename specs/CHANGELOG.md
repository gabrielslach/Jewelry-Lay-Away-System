# Specs changelog

Track edits to files under `specs/`. Newest first. Implementation work is not listed here unless the spec changed.

## 2026-09-26 (implementation)

- Epic 4 mock server is live in `mock-server/` (`npm run dev` serves `/api`).
- Epic 5–9, 2, 3, 6, and 7 implemented in the SPA (auth, services, mobile-first storefront, collections, PDP, account, admin).

## 2026-09-26 (later)

- Implemented Epic 4 mock server (`mock-server/`) and documented invented routes in [`mock-api.md`](mock-api.md).

## 2026-09-26

- Repo tests now `test/` mirroring `src/` (`test/setup.js`). Noted here because agents read this changelog with the specs.
- **Epic 4** (mock development server) added: contract routes plus invented demo-gap endpoints; catalog seed ≥24 pieces, 2–4 images each; admin and customer dev session helpers; mock-gateway reserves without marking paid.
- **Epic 5** — login (`/login`) and register (`/register`) pages, session gates.
- **Epic 6** — `src/services`: one file per API call, render-ready data, `ServiceError`; UI shows the message.
- **Epic 7** — mobile-first retrofit of screens already built. Unimplemented UI epics are specified as mobile-first.
- **Epic 8** — paginated Collections page (`/collections`).
- **Epic 9** — piece page (`/collections/:id`) with image carousel, details, price, reserve.
- Routing list in F-3 updated for collections, piece, login, and register.
- SF-3 is a Home teaser; SF-6 modal stays on Home; Collections uses Epic 9.
- [`tech-debt.md`](tech-debt.md) updated for pagination, carousel images, auth pages, and invented admin/dashboard/settings routes.
