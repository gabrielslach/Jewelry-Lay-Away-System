# Specs changelog

Track edits to files under `specs/`. Newest first. Implementation work is not listed here unless the spec changed.

## 2026-09-27 (editorial hero)

- **Epic 11** — single split home hero (`EH-1`–`EH-3`): approved copy, `/hero-1.png`, no carousel. Supersedes Epic 10.

## 2026-09-26 (hero overlay)

- Epic 10 layout: hero copy overlays the image with a scrim on all widths (no stacked or split panel).

## 2026-09-26 (hero carousel epic)

- **Epic 10** — home hero carousel (`HC-1`–`HC-3`): three slides; photos on 1–2 (`public/hero-1.png`, `public/hero-2.png`); slide 3 solid color + **See how it works** → `/#how`. SF-2 marked superseded for new work.

## 2026-09-26 (gallery JSON)

- Mock gallery is [`mock-server/gallery-items.json`](../mock-server/gallery-items.json); CDN image URLs are kept. Mock-only display fields (`name`, `category`, specs) are still merged on in [`mock-api.md`](mock-api.md).

## 2026-09-26 (user stories + UX bugs)

- Added [`user-stories.md`](user-stories.md): shopper US-1–US-14 and staff US-20–US-26.
- Added [`bugs.md`](bugs.md): UX issues from a pass on the running SPA (storefront + admin, desktop and ~390px).

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
