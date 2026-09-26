# Specs changelog

Track edits to files under `specs/`. Newest first. Implementation work is not listed here unless the spec changed.

## 2026-09-27 (customer orders v1.9)

- My Account uses `GET /api/customers/orders` (no `:id`, bare array). Service maps `on_track`/`overdue`/`completed`, Next Due as Mon D, Completed as Mon YYYY. AC-1 / AC-2 / MS-2 and tech-debt #1 updated.

## 2026-09-27 (v1.9 tech-debt refresh)

- `tech-debt.md` rewritten against `api-definition.md` v1.9 (Sep 26 update): new "Not yet built" table for the breaking `/api/customers/orders` path/shape change, the new `GET /api/customers/me`, admin's own access/refresh split, `DELETE /api/admin/customers/:id/sessions`, the confirmed confirm/reject-only "mark paid" path, and the now-live dashboard/customers/settings endpoints (field-name mismatches noted). Resolved rows (member since, badges, completed list, dashboard KPI/chart, customers directory, settings form) moved out of "Mocked to match the demo."
- Root `package.json` / `vite.config.js`: added `npm run dev:live`, which skips `mock-server` and proxies `/api` to the sandbox base URL from `api-definition.md` Section 1.

## 2026-09-27 (signed-out chrome label)

- **Epic 5 AU-5** — storefront account button reads **Sign in** (→ `/login`) when signed out and **My Account** (→ `/account`) when signed in; chrome and hamburger panel. SF-1, AU-3, and Epic 12 chrome/panel lines point here.
- `bugs.md` **BUG-18** — My Account shows empty lay-away copy while orders load.

## 2026-09-27 (guest reserve gate)

- **Epic 5 AU-4** — guests opening checkout see “Sign in to reserve” (Sign in / Create account) instead of being redirected after Continue; return to `/collections/:id?reserve=1` reopens checkout. Login/Register honour `from` only when it resolves to the same origin.
- `bugs.md` BUG-5 now points to AU-4.

## 2026-09-27 (access and refresh tokens)

- **Epic 15** — customer register/login return `access_token` + `refresh_token`; refresh on `401`; logout revokes one session. Refresh token + customer in `localStorage`, access token in `sessionStorage`. AU-3 and Epic 4 (MS-2, MS-5) point here.
- `api-definition.md` v1.6: breaking auth change, `POST /api/customers/refresh` and `/logout`.
- `tech-debt.md`: login envelope; `localStorage` refresh-token caveat.

## 2026-09-27 (header Mine Credit wordmark)

- Epic 13 **BR-4**: typeset **Mine Credit** beside the header lockup; footer and admin stay image-only.

## 2026-09-27 (bug reevaluation)

- Struck fixed items in [`bugs.md`](bugs.md): BUG-1–9, 14–17. Still open: BUG-10, 12, 13 (need Gabriel) and BUG-11 (completed plan not rechecked on a fresh account).

## 2026-09-27 (Epic 14 collections fallback)

- **Epic 14** — image load failure → GemMark on PieceCard / piece carousel (main + thumbs); empty material/stone/size/cert from GET /api/gallery → `-` via `presentPiece`.

## 2026-09-27 (Mine Credit lockup)

- **Epic 13** — `public/store-logo.png` in theme `Logo`; SPA name **Mine Credit**. Demo.html identity unchanged. AD-8 default `business_name` is Mine Credit.

## 2026-09-27 (hamburger at 910px)

- Epic 12: section links collapse into the hamburger **below 910px**. Chrome **My Account** remains until **≤680px**.

## 2026-09-27 (mobile nav menu)

- **Epic 12** — phone hamburger sheet (`NM-1`–`NM-3`): under-nav panel, overlay, close icon; same SF-1 destinations; Start a Lay-Away stays chrome-only. SF-1 look of the panel points here.

## 2026-09-27 (hero phone copy centered)

- Epic 11 `EH-1`: phone copy under the photo is centered (demo stacked hero); desktop overlay stays left.

## 2026-09-27 (hero phone stacked)

- Epic 11 `EH-1`: phone is stacked (photo 16:9, copy below); desktop remains overlay 16:9.

## 2026-09-27 (hero full-bleed 16:9)

- Epic 11 layout: still-life spans the hero at **16:9**; approved copy overlays the left with **no scrim**.

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
