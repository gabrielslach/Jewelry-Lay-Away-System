# Build guide — epics and features

Step-by-step outline for the Mine Credit React SPA. Visual target is still [`demo.html`](demo.html). Live store identity is **Mine Credit** (**Epic 13**); the demo file still says Sample Jewelry Co. Data contract is [`api-definition.md`](api-definition.md). Gaps and mocks are listed in [`tech-debt.md`](tech-debt.md). Spec edits are logged in [`CHANGELOG.md`](CHANGELOG.md).

**How we build:** pick **one feature id** → `ux` specifies → `developer` implements → `ux` then `reviewer` PASS/FAIL → Gabriel decides. Do not commit unless asked.

**Mock API:** local HTTP fixtures live in **Epic 4**. Feature code talks to **Epic 6** services, not raw `fetch` in components and not new in-memory `src/data` stubs. Invented endpoints stay documented under Epic 4 until they exist on the live backend.

**Mock API:** local HTTP fixtures live in **Epic 4**. Feature code talks to **Epic 6** services, not raw `fetch` in components and not new in-memory `src/data` stubs. Invented endpoints stay documented under Epic 4 until they exist on the live backend.

**Product rules**
- Match demo screens as closely as possible (layout and copy). Cream/plum tokens and fonts are the **default theme**, not values to repeat inside each epic.
- **Mobile-first:** unimplemented features are specified and built for a phone layout first, then `@media (min-width: …)` for tablet/desktop. Do not design desktop-only and squeeze down. Existing screens are retrofitted in **Epic 7**.
- Mock anything the live API cannot back; record it in `tech-debt.md`.
- The HTML demo’s Storefront / Admin switcher and landing chooser are **not** product features. The SPA uses routes.
- My Account is a **page**, not a modal (demo used `#myAccountModalBackdrop`).
- Login and register are **pages** (`/login`, `/register`) — **Epic 5**. The demo has no auth UI; we still ship it so JWT checkout and My Account are real.
- Tests live under `test/` mirroring `src/` (see `.cursor/rules/code-quality.mdc`).

---

## Foundation (do first)

Shared work the storefront, account, and admin epics assume. `F-1` is a **swappable design system**: rebranding (client colors, fonts, images/icons) should mean editing the theme layer, not hunting through page components. HTTP fixtures are Epic 4. HTTP from the SPA is Epic 6.

### F-1 Design system

**Goal:** one theme surface. Later features use tokens and the asset catalog only. No new raw hex (`#B98B2E`), font family names (`'Inter'`), or one-off brand-colored SVGs in feature CSS/JS.

**Color and shape tokens** — single file (implementation later: `src/index.css` `:root` or `src/theme.css`). Seed from the full demo `:root` in [`demo.html`](demo.html):

`--primary`, `--primary-dark`, `--accent`, `--bg`, `--surface`, `--surface-2`, `--text`, `--text-soft`, `--border`, `--ok`, `--warn`, `--radius`, `--shadow`.

**Type tokens** — `--font-display` and `--font-body` (demo defaults: Cormorant Garamond + Inter). Load webfonts from the theme layer, not from each page.

**Asset catalog** — logo wordmark, gem/placeholder illustration, and UI icons in one module (e.g. `src/theme/assets`) using `currentColor` or token fills. Screens import the catalog; they do not inline unique SVGs with hard-coded brand colors.

**Rebrand:** change the token file + swap catalog entries. Layout structure stays.

No component library (MUI, Bootstrap, etc.). Utilities are optional later; they must still consume these tokens.

### F-2 Toast host

Demo `#toastHost` — used by checkout, settings save, mark payment received.

### F-3 Routing

Keep React Router. Grow routes as features land: `/` storefront, `/collections` catalog, `/collections/:id` piece page, `/login`, `/register`, `/account`, `/admin/*`.

---

## Epic 1 — Storefront (`/`)

Public marketing, gallery, piece detail, and lay-away checkout from `#publicView` plus the product and checkout modals.

### SF-1 Public chrome

Sticky nav (logo, Collections / How Lay-Away Works / Reviews / Contact), account button (**AU-5**) + Start a Lay-Away, hamburger + mobile panel, footer `#contact` (Shop / Support / Company columns, demo disclaimer).

Hamburger **look** is **Epic 12** (NM-1–NM-3): section links collapse below **910px**; chrome account button (**AU-5**) until **≤680px**. Destinations stay these.

“Collections” in the nav goes to `/collections` once Epic 8 lands (until then, in-page `#collections` is fine).

### SF-2 Hero

Eyebrow, headline, subcopy, Browse Collections, three stats (3,000+ pieces, 3 Mo. max term, Your Dates). Demo `.hero`.

**Superseded for new work by Epic 11** (editorial home hero). Epic 10 (carousel) is also superseded.

### SF-3 Collections gallery

Card grid: media, category, name, price + “as low as …/payment”, View Details. Demo `#collections` / `#galleryGrid`. Home shows a **six-card teaser** (`page_size=6`) and links to the full catalog (**Epic 8**, `/collections`).

- **API / service:** `GET /api/gallery` via `src/services` once Epic 6 lands.
- **Mock:** category badge, jewelry display name, PHP-style price presentation so cards match the demo. API `title` is a barcode; there is no `category`. See tech-debt.

### SF-4 How it works

Three static steps from demo `#how` (choose piece → set schedule → complete & collect). No API.

### SF-5 Reviews

Three static testimonials from demo `#reviews`. No API.

### SF-6 Piece detail

Demo product **modal** (already shipped on Home). Full-page PDP with image carousel is **Epic 9**; Collections navigates there instead of opening this modal.

- **API / service:** `GET /api/gallery/:id`.
- **Mock:** spec fields the gallery object does not return.

### SF-7 Checkout — schedule

Step 1: lay-away term select + per-payment dates and amounts. Demo `#checkoutStep1` (1 / 2 / 3 months → 2 / 4 / 6 payments).

- **API:** `POST /api/layaway/plans` with `product_id`, `term_months` (max 3), `installment_dates` — requires customer JWT.
- **Mock:** plan create (and session) until Epic 5. Keep demo term options even if the API shape is `term_months` + dates.

### SF-8 Checkout — payment method

Step 2: GCash / E-Wallet, Bank Transfer, Credit / Debit Card. Demo `#checkoutStep2`.

- **API:** gateway `POST .../payments` is `501`. Manual path: `GET /api/bank-accounts`, `POST /api/layaway/plans/:id/payments/manual`.
- **Mock:** GCash and card (and bank until the manual path is wired). Record unused live payment APIs in tech-debt.

### SF-9 Checkout — confirmation

Step 3 success copy + Done + toast (“Reservation submitted…”). Demo `#checkoutStep3`.

---

## Epic 2 — My Account (`/account`)

Same content as the demo My Account modal, as a full page. **Mobile-first.** After Epic 5, this page requires a customer session; unauthenticated users go to `/login`.

### AC-1 Account shell

Page title “My Account”, summary grid: name, email, active lay-away count, member since.

- **API / service:** `GET /api/customers/orders` (Bearer; customer from the token — **v1.9**, no `/:id`).
- **Mock:** jewelry `item_name` (live is barcode). `phone` / `member_since` on the cached customer until AC-1 uses `GET /api/customers/me`.

### AC-2 Active lay-aways

Card per plan: item name, On Track / Overdue badge, plan label, order id, next due, installment schedule rows.

- **API:** the orders list itself now includes `installments`, `plan_label`, `next_due_date`, and rolled-up `status` (`on_track` / `overdue` / `completed`). No second `GET /api/layaway/plans/:id` for this page.
- **Display:** `on_track` → On Track; `overdue` → Overdue. Next Due from `next_due_date` as **Mon D** (e.g. Oct 1). `Order #{id}` is the numeric id.

### AC-3 Completed lay-aways

Completed rows (item, plan, “Completed {date}”) or empty copy from the demo. Date from `completed_on` as **Mon YYYY** (e.g. Jul 2026).

### AC-4 Empty states

Demo copy when there are no active or no completed lay-aways.

---

## Epic 3 — Admin (`/admin`)

Internal staff UI from `#adminView` plus order and customer modals. The API doc calls this Phase 2; we still build the **screens**. Bind live admin endpoints where they fit; mock the rest. **Mobile-first:** sidebar as overlay on small screens (demo already has this pattern).

### AD-1 Admin chrome

Sidebar: Dashboard, Orders & Installments, Customers, Settings. Sticky topbar title, decorative search + bell. Mobile sidebar + backdrop.

Nested routes: `/admin`, `/admin/orders`, `/admin/customers`, `/admin/settings`.

No API (chrome only). Search and notifications are visual until an API exists.

### AD-2 Dashboard KPIs

Four cards: active lay-aways, collected this month, overdue payments, active customers. Demo `.kpi-row`.

- **API:** `GET /api/admin/dashboard` (Epic 4 MS-5) once the mock exists; otherwise approximate from `GET /api/admin/plans`.
- **Mock:** collected-this-month and any KPI the plans list cannot support.

### AD-3 Dashboard panels

“Collections — Last 6 Weeks” bar chart and “Recent Activity” list. Use `GET /api/admin/dashboard` when Epic 4 lands.

### AD-4 Orders table

Filters All / On Track / Overdue. Columns: Order, Customer, Item, Plan, Next Due, Status, View.

- **API:** `GET /api/admin/plans` (`customer_name`, `customer_email`, `overdue_count` / `pending_count` / `paid_count`).

### AD-5 Order detail

Modal/panel: customer, item, plan, status, installment schedule, **Mark Next Payment Received**.

- **API analog:** `GET /api/admin/payments/pending`, proof, confirm/reject.
- **Mock:** `POST /api/admin/plans/:id/mark-next-paid` (Epic 4) if the demo one-click path does not map 1:1.

### AD-6 Customers table

Name, email, active lay-aways, member since, View.

- **API:** `GET /api/admin/customers` (invented, Epic 4). Until then mock demo rows.

### AD-7 Customer detail

Email, mobile, active lay-aways, member since.

- **Mock:** mobile and member since (not in the published API contract).

### AD-8 Settings

Business name, maximum lay-away term (months), late payment penalty, toggles (full payment before release, SMS reminders, customer-selected due dates), Save Changes + toast.

- **Mock:** `GET`/`PUT /api/admin/settings` (Epic 4).
- Live `markup-rules`, `penalty-rules`, and `POST /api/bank-accounts` are **not** this screen; list them in tech-debt as unused by the demo UI.

---

## Epic 4 — Mock development server

Local HTTP mock so `npm run dev` can exercise storefront, account, and admin the way [`demo.html`](demo.html) does, without the Hostinger sandbox.

**Contract rule:** every endpoint in [`api-definition.md`](api-definition.md) is implemented with the documented method, path, auth, status codes, and response envelope. Where that contract cannot power a demo screen, **invent** an extra endpoint (or extra mock-only fields), document it in this epic (and a short `specs/mock-api.md` when implementing), and seed it from the demo fixtures.

**Not in scope:** calling the live sandbox; building real gateway/ledger logic. Customer **login/register pages** are Epic 5 — the mock still implements `POST /api/customers/login` and `register`. Keep `POST /api/dev/session/customer` until Epic 5 so checkout can run without those screens.

### MS-1 Dev process and proxy

One command starts Vite **and** the mock. Browser calls same-origin `/api/...` (Vite proxy or middleware). CORS and the sandbox base URL stay out of the SPA.

Replace in-memory `src/data/gallery.js` / `plans.js` Promise stubs with **Epic 6** services that call `/api`. Unit tests live in `test/services/` and double `fetch` (or hit mock handlers), not a second copy of fixtures.

### MS-2 Storefront contract (as published)

Seed enough catalog and customers to fill Home, **Epic 8** pagination, **Epic 9** carousels, and My Account.

| Method | Path | Mock behavior |
| --- | --- | --- |
| GET | `/api/gallery` | Paginated `{ count, next, previous, results }` with `id`, `title` (barcode), `price`, `currency`, `in_stock`, `images`. Support `page` / `page_size` (default `page_size=12`). Seed **at least two pages**. |
| GET | `/api/gallery/:id` | Same object as one `results` item, or `404`. Each piece has **2–4** `images` entries for Epic 9. |
| POST | `/api/customers/register` | Create customer; `429` after 10 attempts / 15 min per IP (`{ error }`). |
| POST | `/api/customers/login` | `{ access_token, refresh_token, customer }` (**Epic 15**); same rate limit. Seed **Sample Client**. |
| POST | `/api/customers/refresh` | `{ refresh_token }` → `{ access_token }`; `401` if expired, revoked, or unknown (**Epic 15**). |
| POST | `/api/customers/logout` | `{ refresh_token }` → revoke that one session (**Epic 15**). |
| GET | `/api/customers/orders` | Bearer; customer from the token (`401` without). Bare **array** (v1.9): `id`, `item_name`, `plan_label`, `next_due_date`, `status` (`on_track`/`overdue`/`completed`), `completed_on`, `installments[]`. Include active **and** completed. |

**Demo display (mock-only fields on gallery objects):** `name`, `category`, `material`, `stone`, `size`, `cert` — same values as the demo `pieces` array for the original six; invented but consistent for extra catalog rows. Live API will not send these. Document as mock-only in `specs/mock-api.md`.

### MS-3 Lay-away and checkout contract (as published)

| Method | Path | Mock behavior |
| --- | --- | --- |
| POST | `/api/layaway/plans` | Auth required. Body: product_id, term_months (max 3), installment_dates (YYYY-MM-DD array). customer_id comes from the token. Return id, total_price, currency, term_months, installments, optional note. Persist so My Account and admin lists update. |
| GET | `/api/layaway/plans/:id` | `installments` with `id`, `due_date`, `amount`, `status`, `paid_at`. Flip `pending` past `due_date` to `overdue` on read. |
| POST | `/api/layaway/plans/:id/payments` | Stay **`501`** to match the contract. Demo GCash / card still complete via **MS-5** `POST /api/layaway/plans/:id/payments/mock-gateway`. |
| POST | `/api/layaway/plans/:id/payments/manual` | Auth, multipart: `installment_id`, `bank_account_id`, `proof_of_payment`. `{ id, status: 'submitted', note }`. |
| GET | `/api/bank-accounts` | Public list `{ id, bank_name, account_name, account_number, qr_code_url }`. |

### MS-4 Admin contract (as published)

Admin JWT from `POST /api/admin/login` → `{ token, admin }`. All routes below require it (`401` without).

Implement even when the demo has no screen: `GET /api/finance/ledger`, `POST`/`GET /api/admin/markup-rules`, `POST`/`GET /api/admin/penalty-rules`, `POST /api/bank-accounts` (multipart), `GET /api/admin/payments/pending`, `GET /api/admin/payments/:id/proof`, `POST .../confirm`, `POST .../reject` (`reason?`).

`GET /api/admin/plans` must include `customer_name`, `customer_email`, `overdue_count` / `pending_count` / `paid_count` for AD-4, plus mock-only **item name**, **plan label**, and **next due** so the demo table can render.

Confirm/reject should mark installments paid, write a ledger row, and complete the plan when it was the last installment — enough for AD-5 if we later switch off the one-click mock.

### MS-5 Invented endpoints (demo gaps)

Arbitrary contracts. Shapes can be simple JSON; they exist so the HTML demo’s behaviors work against HTTP.

**Checkout without login screens (until Epic 5)**  
`POST /api/dev/session/customer` — no body, or `{ email }` defaulting to Sample Client. Returns the same envelope as login (`{ access_token, refresh_token, customer }` after **Epic 15**).

**Admin without a login screen**  
`POST /api/dev/session/admin` — returns `{ token, admin }` for a seeded staff user.

**GCash / card in the demo (SF-8)**  
`POST /api/layaway/plans/:id/payments/mock-gateway` — auth. Body `{ method: 'gcash' \| 'card' }` (`ewallet` is the same as `gcash`). Creates/keeps the plan **reserved**; does **not** mark an installment paid (the HTML demo only toasts “Reservation submitted”). **Not** the live `501` gateway.

**My Account extras (AC-1)**  
Customer object (login + orders context) includes mock-only `phone` and `member_since` (demo: `+63 900 000 0001`, `Jan 2026`).

**Admin dashboard (AD-2 / AD-3)**  
`GET /api/admin/dashboard` → `{ active_layaways, collected_this_month, overdue_payments, active_customers, collections_last_6_weeks: number[6], recent_activity: [{ title, detail }] }`. Seed KPI collected `184200`, bars `[62,80,55,90,74,96]`, and the four demo activity lines (or equivalent derived from seed orders).

**Customers directory (AD-6 / AD-7)**  
`GET /api/admin/customers` and `GET /api/admin/customers/:id` with `name`, `email`, `phone`, `active_layaways`, `member_since`. Include Sample Shopper (LA-1005).

**Mark next payment received (AD-5)**  
`POST /api/admin/plans/:id/mark-next-paid` — marks the next unpaid installment paid and sets plan status on-track. Matches the one-click demo button (not confirm/reject + proof).

**Settings persistence (AD-8)**  
`GET` and `PUT /api/admin/settings`: `business_name`, `max_term_months`, `late_penalty_per_day`, `require_full_payment_before_release`, `sms_reminders`, `customer_selected_due_dates`. Default **Mine Credit**, 3, 50, all toggles on (**Epic 13**). In-memory persist for the process lifetime.

### MS-6 Seed data

Start from the demo script fixtures, then expand the catalog to **≥24 pieces** (paginate at 12) with 2–4 image URLs each (placeholders are fine). Keep five active orders (`LA-1001`–`LA-1005`), one completed (`LA-0987` / Vintage Rose Pendant), and customers including **Sample Shopper** (owner of LA-1005). Sample Client remains the default shopper. Mutations stick until the mock process restarts.

### MS-7 Error and auth behavior

Match the contract where it specifies status codes: `401` missing/invalid token, `403` wrong customer, `404` unknown id, `429` on register/login flood (`{ error }`), `501` on the real gateway path. Unknown invented paths `404`. Keep responses JSON UTF-8.

---

## Epic 5 — Login and registration

Customer auth screens the HTML demo never had. Needed for JWT checkout and My Account. **Mobile-first.** Admin login is not this epic (use `POST /api/dev/session/admin` until a staff screen exists).

### AU-1 Register (`/register`)

Name, email, password (and confirm). Submit `POST /api/customers/register` through a service. Success → store token + customer, go to `/account` (or return URL). Validation errors and `429` (“please wait a few minutes”) are **on-page messages**. Link to `/login`.

### AU-2 Login (`/login`)

Email + password. `POST /api/customers/login` through a service. Same token storage, distinct copy for wrong password vs `429`, link to `/register`. Optional return-to query so checkout can send the user here.

### AU-4 Guest reserve gate

A guest who opens checkout (piece page **Reserve This Piece**, home product modal) sees a sign-in step **instead of** step 1, inside the same “Reserve on Lay-Away” dialog. No silent redirect after Continue.

- Body reuses the `confirm-box` layout (no check icon): heading **Sign in to reserve**, text **Your lay-away plan is saved to your account so you can track payments in My Account.** Plain text, not an alert.
- Footer: outline **Create account** → `/register?from=…`, primary **Sign in** → `/login?from=…`. No Cancel (✕ / Escape close). No step dot for this step.
- Return target is always `/collections/:id?reserve=1` (the home modal has no URL of its own).
- Login and Register follow `from` only when it starts with `/` and resolves to the same origin and the normalized path does not start with `//` (rejects `//host`, `/\host`, `/.//host`, tab/newline tricks); otherwise `/account`. Their cross-links (“Create an account” / “Sign in”) pass `from` on only when the page was opened with one. Both pages open scrolled to the top.
- Piece page with `?reserve=1` and a signed-in customer opens checkout on step 1 (default term and dates), then removes `reserve` with a replace navigation.
- Signed-in shoppers never see this step. Do not sign in inside the dialog, gate the Reserve buttons, persist term/dates, or offer guest checkout (`POST /api/layaway/plans` needs a customer).

### AU-3 Session and gates

Persist the customer session (access + refresh tokens and storage rules are **Epic 15**). `/account` and `POST /api/layaway/plans` require it. Nav account button: see **AU-5**. After AU-3, stop using `POST /api/dev/session/customer` in the SPA (mock may keep the route).

### AU-5 Signed-out chrome label

The storefront account button reads **Sign in** (→ `/login`, no `from`) when there is no customer session and **My Account** (→ `/account`) when signed in. Same outline `sm` button, placement, and Epic 12 breakpoints (chrome from 681px, `#mobile-panel` row ≤680px). Sign out stays on My Account only. `/login` and `/register` keep redirecting a signed-in customer to `from` or `/account`. Admin chrome unchanged.

---

## Epic 6 — Services

All HTTP lives in `src/services`. Components and pages do not call `fetch` themselves. **No visual layout** in this epic; consuming screens still follow mobile-first when they render errors.

### SV-1 Layout

One **service** = one API call = one file. Name the file after the call (`getGallery.js`, `getGalleryPiece.js`, `loginCustomer.js`, `createLayawayPlan.js`). Tests: `test/services/<sameName>.test.js`.

Shared helpers (base URL, `Authorization` header, `ServiceError`) may live in `src/services/http.js` — that is not a “service”; do not hide multiple endpoints in it.

### SV-2 Render-ready results

Each service returns data the UI can render: display name, category, formatted price, installment rows, badges — not an unprocessed wire envelope. Mapping that today sits in `src/data/` moves here.

### SV-3 Errors

Every service handles network failure, non-OK HTTP, and JSON parse errors. It throws a `ServiceError` with a **user-visible** `message` and `status` when known (`401`, `403`, `404`, `429`, `501`). Pages and components that load data show that message (inline alert or equivalent). Do not swallow errors.

When this epic lands, Gallery, Checkout, and later Account/Admin/Collections/Piece must show a failure state if the service fails.

---

## Epic 7 — Mobile-first (existing UI)

Retrofit screens **already built** (Foundation chrome, Home, gallery, piece modal, checkout). Unimplemented **UI** epics (2, 3, 5, 8, 9) follow the product-rule mobile-first approach from the start — do not wait for this epic to “add mobile later.” Epics 4 and 6 are server/client HTTP, not layouts.

### MF-1 Storefront retrofit

Nav, hero, gallery grid, how-it-works, reviews, footer, piece modal, checkout steps: readable on a ~375px viewport without horizontal scroll. Type, spacing, and tap targets first; then `min-width` breakpoints for the demo’s desktop look. Verify phone and desktop.

### MF-2 Shared controls

Button, modal, cards, and form rows used on those screens get the same treatment so later pages inherit it.

---

## Epic 8 — Collections page (`/collections`)

Paginated catalog, not the Home teaser. **Mobile-first.** Nav “Collections” goes here (Home `#collections` can remain a short grid + “View all”).

### CL-1 Page and pagination

Card grid like SF-3. `GET /api/gallery?page=&page_size=` through `getGallery`. Show page controls (prev/next and/or page numbers) from `count` / `next` / `previous`. Empty, loading, and **service error** states.

Default `page_size` 12. Mock must have enough rows for at least two pages (Epic 4 MS-2 / MS-6).

### CL-2 Open a piece

Clicking a card (not only “View Details”) navigates to `/collections/:id` (**Epic 9**). Do not open the Home piece modal.

---

## Epic 9 — Piece page (`/collections/:id`)

Store-like product page: image carousel, details, price, reserve. **Mobile-first.** Replaces the modal for traffic from Collections; Home may keep SF-6 until a later cleanup.

### PD-1 Gallery carousel

Main image + thumbs or swipe. Source: `images[]` from `GET /api/gallery/:id` (`getGalleryPiece`). If empty, use the gem placeholder. Mock seeds 2–4 images per piece (Epic 4). Live catalog may only have one (or none) — see tech-debt.

### PD-2 Details and price

Display name, category, barcode/`title` if useful, specs (material, stone, size, cert — mock-only), in-stock, formatted price and “as low as …/payment.” Service maps wire fields to this view model.

### PD-3 Reserve

Primary action starts checkout (existing Checkout flow) with this piece. Back link to `/collections`. `404` / service error copy on the page.

---

## Epic 10 — Home hero carousel

**Superseded for new work by Epic 11** (editorial home hero). Do not extend the carousel.

Replace the SF-2 text stack with a **three-slide carousel** so the pitch is easier to scan. Slides 1–2 use `public/hero-1.png` and `public/hero-2.png` (Higgsfield mark already cropped off). Slide 3 uses a solid color until a third photo exists. **No API.** **Mobile-first.** Home still owns this block; How-it-works and Reviews stay below as today.

Copy stays the current Sample Jewelry Co. strings (same as SF-2 / demo). Do not invent a new slogan unless Gabriel asks.

### HC-1 Carousel shell

One `Hero` region at the top of `/`. Role `region` with an accessible name (e.g. “Featured”). Only **one slide** is in view.

Controls:

- **Dots** (required) — one per slide, `aria-current` on the active slide, labels like “Show slide 2 of 3”.
- **Previous / Next** — visible from `min-width: 800px`; on a phone, swipe (touch) is enough plus dots. Buttons must have names (“Previous slide”, “Next slide”). Wrap from last to first.
- Keyboard: Left/Right when the carousel is focused.

Do **not** autoplay. Honor `prefers-reduced-motion` (no slide animation, instant swap).

Reuse `Button` for CTAs. Do not add a carousel library.

### HC-2 Slides (split the current hero)

Three slides. Slide 3 is a solid `--surface-2` panel (swap in a photo later without changing copy):

| Slide | Image | Copy (keep wording) | CTA |
| --- | --- | --- | --- |
| 1 — Hook | `/hero-1.png` | Eyebrow **Fine Jewelry, Paid Your Way**. Headline **Reserve the piece you love, pay for it on your schedule.** | **Browse Collections** → `/collections` |
| 2 — Plan | `/hero-2.png` | Subcopy only: **Browse our curated jewelry collection and secure any piece with a flexible lay-away plan — up to 3 months, with payment dates you choose.** | **Start a Lay-Away** → `/collections` (same destination as the nav primary) |
| 3 — Proof | solid color | The three stats only: **3,000+** Pieces Available · **3 Mo.** Max Lay-Away Term · **Your Dates** Flexible Due Days | **See how it works** → `/#how` |

Copy **overlays** the photo on every width (object-fit cover). A dark scrim behind the type keeps `--on-accent` / `--primary` readable. Dark maroon CTAs keep white labels (existing button rule). Dots stay below the image.

### HC-3 Tests

`test/components/Hero.test.jsx` (and a small carousel primitive under `test/` if extracted). Assert: slide 1 heading + Browse Collections; activating next/dot 2 shows the plan subcopy and hides the stats; slide 3 shows **3,000+** / **3 Mo.** / **Your Dates** and **See how it works**. Image `src` is `/hero-1.png` then `/hero-2.png` as specified. No new services.

---

## Epic 11 — Editorial home hero

Replace the Epic 10 carousel with a **single** editorial hero: `/hero-1.png`, approved copy (Aura-style, **no scrim**). Desktop is a full-bleed **16:9 overlay**; phone is **stacked** (see EH-1). **No API.** **No carousel.** **Mobile-first.** How-it-works and Reviews stay below. Copy is the block Gabriel approved (2026-09-27).

### EH-1 Layout

One `Hero` region at the top of `/`. Accessible name e.g. “Featured”.

- Full-bleed `/hero-1.png` (`object-fit: cover`). Same stack as EH-2 (eyebrow → headline → body → CTA → stats). **No scrim / overlay background.** Reuse `Button` primary. Three stats under the CTA (wrap if needed). No icons required.
- **Desktop (`min-width: 800px`):** `.hero-frame` is **16:9**. Copy sits **on** the photo, left-aligned. Type uses `--text` / `--text-soft` / `--primary` against the light side of the still-life (Aura-style).
- **Phone (`< 800px`):** stacked — photo **16:9** on `.hero-media` only (`object-position: right center`), copy **below** on page `--bg`, **centered** (matches demo stacked hero). Frame height is image + copy; overflow must not clip the copy.

### EH-2 Copy (approved)

| Part | Text |
| --- | --- |
| Eyebrow | **Paid Your Way** |
| Headline | **Reserve the Piece.** / **Pay on Your Terms.** (two lines) |
| Body | **Secure any jewelry with a flexible lay-away — up to 3 months, on dates you choose.** |
| CTA | **Browse Collections** → `/collections` |
| Stats | **3,000+ pieces** · **Up to 3 months** · **Dates you choose** |

### EH-3 Tests

`test/components/Hero.test.jsx`. Assert: headline (both lines), body, Browse Collections → `/collections`, the three stats, `img` `src` `/hero-1.png`. No slide dots/prev/next. No new services.

---

## Epic 12 — Mobile nav menu

Elevate SF-1 hamburger + `#mobile-panel`. **Same destinations.** **Start a Lay-Away** stays chrome-only. Tokens only (`--primary`, `--accent`, `--bg`, `--surface`, `--surface-2`, `--text`, `--text-soft`, `--border`, `--radius`, `--shadow`, `--font-display`, `--font-body`, `--nav-bg`; `--on-accent` / `--accent-hover` already on the CTA). **No API.** **Mobile-first.** Section links collapse into the hamburger **below 910px**. The chrome account button (**AU-5**) stays until **phone (≤680px)**, then only in the sheet. Scope: hamburger, panel, overlay under sticky nav. Do not restyle the rest of the site.

UX direction (2026-09-27): under-nav jewelry sheet (not a Material drawer); dim the page, keep the bar; hamburger becomes close.

### NM-1 Look

- **Hamburger (closed):** 38×38, radius **8px**, `--surface-2`, `--text`, `HamburgerIcon` 20px, `aria-label="Menu"`, `aria-controls="mobile-panel"`, `aria-expanded="false"`.
- **Hamburger (open):** same hit target; background `--accent`; icon `--on-accent`; swap to `CloseIcon` 18px; `aria-label="Close menu"`; `aria-expanded="true"`.
- **Panel:** still a child of sticky `.pv-nav`, full width, **not** a left/right drawer. Background `--surface-2`. Top edge: **1px `--primary`**. Padding **8px 16px 20px**. No `--shadow` on the sheet (nav already sticky).
- **Section links** (Collections, How Lay-Away Works, Reviews, Contact): `--font-display`, **22px**, weight 500, `--text`. Block padding **12px 8px**, **min-height 44px**. **1px `--border`** between items. Hover/focus-visible: `--accent` (no underline). Current route (`/collections` when on that page): `--accent`.
- **Account button (AU-5 label):** after a **1px `--primary`** rule and **12px** top padding. Reuse **outline `Button` `sm`**: **Sign in** → `/login` or **My Account** → `/account` (same session rule as chrome). Full width of the padded panel. Show this row **only ≤680px** (the chrome account button is visible from 681px). Do **not** add Start a Lay-Away in the panel.
- **Overlay:** fixed, inset 0, **z-index below `.pv-nav` (100)** so bar stays on top. Fill `color-mix(in srgb, var(--text) 32%, transparent)`. Not in the tab order.
- **681px–909px:** hamburger + sheet for section links; chrome still shows the account button and Start a Lay-Away.
- **≥910px:** inline `.pv-links`; hamburger, panel, overlay **not shown**. No desktop menu.

### NM-2 Motion / behavior

- Toggle on hamburger click. Close on: overlay click, **Escape**, any panel link, logo, Start a Lay-Away, viewport **≥910px** (reset `menuOpen` so `aria-expanded` is false).
- Open/close **~200ms** ease: overlay opacity 0→1; panel opacity + `translateY(-8px)`→0. `prefers-reduced-motion: reduce` → no transform/opacity animation.
- While open: set **`inert`** on `main` and `footer`. Do not scroll-lock the document if inert is enough to ignore background; if the page still scrolls under the overlay, lock `body` overflow until close.
- Focus: leave focus on the hamburger when opening. On Escape/close, focus the hamburger. Do not add a focus-trap library; inert + nav contents is the trap.
- Keep closing on destination click. Hash links (`/#how` etc.) still close.

### NM-3 Tests

`test/layouts/StorefrontLayout.test.jsx` (extend). Assert:

- Menu button `aria-controls="mobile-panel"`; closed → `aria-expanded="false"`, name **Menu**; open → `aria-expanded="true"`, name **Close menu**.
- Open panel: Collections `/collections`, How Lay-Away Works `/#how`, Reviews `/#reviews`, Contact `/#contact`. **No** “Start a Lay-Away” inside `#mobile-panel`. The account button (AU-5: **Sign in** → `/login` signed-out, **My Account** → `/account` signed-in) is in the panel markup and is chrome-visible from 681px (CSS hides the panel row).
- Overlay present when open; click overlay closes. Escape closes. Clicking a panel link closes.
- Chrome still has Start a Lay-Away → `/collections` as primary.

No new services.

---

## Epic 13 — Brand lockup and name

Replace the Cormorant **Sample Jewelry Co.** wordmark with `public/store-logo.png` and SPA copy **Mine Credit**. **Same destinations.** F-1 catalog only (no `<img>` in layouts/pages). **No API** except seed `business_name`. **Mobile-first.** Do not restyle the hero or rewrite `specs/demo.html`.

UX direction (2026-09-27): full square beige lockup as a small brand plate; no invert. Header typeset name is **BR-4**.

### BR-1 Logo placement

**Asset:** `public/store-logo.png` (opaque square). Only `src/theme/Logo.jsx` + `.logo` in `assets.css`.

**`Logo`:** Wrapper `as` default `p` (layouts still `as="span"`). Renders `<img src="/store-logo.png" alt="Mine Credit" />`. No default children wordmark; do not render `children` as visible name. Accessible name = alt. Nav `Link` wrapping the logo unchanged. Admin sidebar: still not a link.

**Img:** `display: block`; `object-fit: contain`; `object-position: center`; `width: auto`; height from context; `max-width` = same as height (square). `border-radius: 8px`; `border: 1px solid var(--border)`.

| Surface | Height | Notes |
| --- | --- | --- |
| Storefront nav ≤680 | **36px** | Pad 12px 16px. `.pv-nav-inner` `flex-wrap: nowrap`. Drop text `font-size`/`white-space` on `.pv-nav .logo`. |
| Nav 681–909 | **40px** | Hamburger still in chrome. Pad 16px 24px. |
| Nav ≥910 | **48px** | Hamburger hidden; links inline. |
| Footer | **88px** | On `--text`. Border `var(--footer-line)`. Drop `color: var(--on-accent)` on `.footer-inner .logo`. |
| Admin sidebar | **72px** | Same plate. Drop on-accent text color on `.admin-sidebar .logo`. |

Dark surfaces show the beige square. Do not knock out the field.

**Not in this epic:** hero, piece cards, favicon, login/register, mobile-panel header.

### BR-2 Name copy (SPA only)

Replace **Sample Jewelry Co.** with **Mine Credit** in live SPA:

- `index.html` `<title>` → `Mine Credit — Lay-Away`
- Footer © line → keep the sample-data disclaimer; `© 2026 Mine Credit (fictional).`
- Mock seed `business_name` → `Mine Credit`
- Logo tests / settings field display value

Leave hero/CTAs. Palette/fonts unchanged.

### BR-3 Tests

`test/theme/Logo.test.jsx`: img `src` `/store-logo.png`, accessible name **Mine Credit**; `className` on wrapper `.logo`; `as="h1"` heading named **Mine Credit**; no visible “Sample Jewelry Co.” or a second typeset “Mine Credit”.

`test/layouts/StorefrontLayout.test.jsx`: nav home link contains that image; footer does too.

`test/pages/admin/Settings.test.jsx` + `test/services/getAdminSettings.test.js`: default **Mine Credit**.

No pixel-height asserts in JSDOM. No new services.

### BR-4 Header wordmark

Storefront **header** only: typeset **Mine Credit** beside the plate so the 36–48px PNG is readable. **Footer and admin stay image-only.** Do not typeset **MURA NA HULUGAN PA**.

**`Logo`:** `withName` boolean, default **false**. Wrapper classes `logo` and `logo--named` when `withName`. `withName={false}`: img `alt="Mine Credit"` only. `withName={true}`: img **`alt=""`** plus `<span className="logo-name">Mine Credit</span>` (hard-coded, not `business_name`). Storefront nav: `<Logo as="span" withName />`. Footer and admin: no `withName`.

**Type (tokens, `assets.css`):** `--font-display`, weight 700, `--text`. `.logo--named`: `inline-flex`, `align-items: center`, `flex-shrink: 0`, `white-space: nowrap`. Plate heights unchanged (BR-1). Gap **6px** ≤680, **10px** ≥681. Name: ≤680 **16px** letter-spacing 0; ≥681 **22px** letter-spacing 0.5px.

**Row:** keep full **Start a Lay-Away**, nowrap inner ≤680. One row at **≥360px**. Do not ellipsize the name. Do not drop the plate.

**Tests:** `Logo` default still has no visible “Mine Credit” text; `withName` shows the text once and empty img alt. Nav home link named **Mine Credit** with visible wordmark; footer img still `alt="Mine Credit"`. Admin sidebar has no `.logo-name`.

---

## Epic 14 — Collections image fallback and empty specs

When a piece image URL fails to load, show the demo gallery jewel icon. When Material / Stone / Size / Certification has no data from GET /api/gallery, show hyphen-minus `-`. Reuse GemMark and presentPiece. No new flows. F-1: no new raw brand hex.

### CF-1 Image load failure → GemMark

**Surfaces:** `PieceCard` (`.piece-media` on `/collections` and the home teaser — same component; do not restyle the hero) and piece page `/collections/:id` carousel main + thumbs.

**Behavior:** Missing URL or `<img>` `onerror` → replace the broken image with existing `GemMark` from `src/theme/GemMark.jsx`. Do not add a second SVG.

Display matches demo gallery `GEM_ICON` in `specs/demo.html`:

- size 70, viewBox 0 0 24 24, fill none, strokeWidth 1.3, color `var(--primary)` via existing `.gem-mark { color: var(--primary) }`
- paths already in GemMark
- centered in the existing `.piece-media` (190px flex center). Do not recolor `.piece-media` and do not add raw hex `#EADFCB`.

Carousel main: same GemMark default size 70, centered in the existing carousel well.

Thumbs are 64×64 (`.thumb` in PiecePage.css). Show the same GemMark artwork fully visible inside the thumb (pass a size that fits, about 36), same stroke and paths. Do not drop a 70px icon into a 64px box so it gets cropped.

When the carousel index changes, a new URL must be allowed to try loading again (reset failure state when `src` changes).

Home product modal (`PieceDetail`): optional `onerror` so a broken URL is not a broken image, but keep `GemMark size={60}` (demo modal is 60 / stroke 1.4). Do not change GemMark’s default strokeWidth (gallery stays 1.3). Do not restyle the modal to the gallery gem. If adding onerror to the modal requires the shared component, pass `size={60}`.

### CF-2 Empty description fields → `-`

In `src/services/presentPiece.js` only (the live GET /api/gallery path), for material, stone, size, cert: missing, null, or blank after trim → ASCII hyphen-minus `"-"`, not em dash `—`.

Unchanged: `name = item.name || item.title`; `category = item.category || 'Jewelry'`; price; images.

There is a duplicate `presentPiece` in `src/data/gallery.js`. If the SPA UI no longer imports it, do not refactor that module. If you must touch it because tests or UI still depend on the em dash and you would otherwise leave two behaviors, only change the four fallback characters to `"-"` if that file is still used by the app. Prefer leaving unused data-layer code alone. Check imports first.

### CF-3 Tests

- Piece image fallback: URL present + fire error event → gem accessible image, the `<img>` is gone. Missing URL → gem. Successful URL → img.
- Piece page: failed main and a failed thumb show GemMark; thumb button chrome remains.
- presentPiece: omit / null / `""` / whitespace for the four fields → `"-"`; present values unchanged; name falls back to title; category stays `"Jewelry"` when absent.

Tests under `test/` mirroring `src/`. Vitest + Testing Library. User-visible behavior.

---

## Epic 15 — Customer access and refresh tokens

Customer register and login no longer return one `token`. They return a short-lived **access token** (15 minutes) and a **refresh token** (24 hours, or until logout). The SPA keeps sending `Authorization: Bearer <access_token>` on protected calls. When that is rejected with `401`, the SPA gets a new access token from the refresh token and retries once, without sending the shopper back to `/login`. **No new screens or copy.** Admin auth stays `{ token, admin }`.

Supersedes the customer half of **AU-3** (session storage and the single JWT). AU-1 / AU-2 pages are unchanged apart from what they store. Contract: [`api-definition.md`](api-definition.md) Section 1.

### RT-1 Session from register and login

`POST /api/customers/register` and `POST /api/customers/login` return `{ access_token, refresh_token, customer }`.

**Storage (`src/services/session.js`):**

- `refresh_token` and `customer` → `localStorage`. Closing the tab or browser keeps the shopper signed in until the refresh token expires or is revoked.
- `access_token` → `sessionStorage`. It lives 15 minutes; a new tab gets its own via RT-2.
- **Signed in** means a refresh token and customer are stored. `SessionProvider` reads them on load, so nav “My Account” and `/account` work in a new tab.
- The old `sessionStorage` `customerSession` (`{ token, customer }`) is ignored and removed. That shopper signs in again once.

`getCustomerToken()` returns the access token. Services never read `refresh_token` themselves.

**Mock:** register, login, and `POST /api/dev/session/customer` return the new envelope. Access tokens expire 15 minutes after issue and refresh tokens 24 hours after issue (use the store clock so tests can advance it). Admin login and `POST /api/dev/session/admin` stay `{ token, admin }`.

### RT-2 Refresh on 401 (and on a missing access token)

New service `refreshCustomerToken` → `POST /api/customers/refresh` with `{ refresh_token }` → `{ access_token }`. The refresh token is **not** rotated.

Customer requests (`getCustomerOrders`, `createLayawayPlan`, `mockGatewayPayment`, and any later customer-auth service) go through one shared authorized-request path:

1. No access token but a refresh token is stored → refresh first (new tab, or `sessionStorage` cleared).
2. Send with `Bearer <access_token>`.
3. On `401`, refresh once, save the new access token, retry the original request once.
4. A second `401` on the retry is a real failure (`Please sign in to continue.`). `403` / `404` / `429` / network errors are not refreshed.

Only **one refresh in flight**: concurrent callers wait for it and reuse the result. Never refresh `login`, `register`, `refresh`, or `logout`.

Refresh `401` (expired or revoked) clears the customer session in both storages **and** updates `SessionProvider`. `/account` then follows the existing redirect to `/login`; checkout shows its existing signed-out message. Guests with no refresh token keep today’s checkout behavior (`Please sign in to continue.`, no POST).

No timers or JWT decoding. Expiry is whatever the server says with `401`.

### RT-3 Sign out revokes that session

My Account **Sign out** (already on the page) calls service `logoutCustomer` → `POST /api/customers/logout` with `{ refresh_token }`, then clears the local session. Clear locally even if the call fails (network or `401`), so this browser is signed out; the server-side token then just expires. Same destination and copy as today.

Revokes **only this** refresh token. Other browsers stay signed in. Another tab in the same browser shares `localStorage`, so its next refresh fails and it signs out; its current access token can still work for up to 15 minutes. Acceptable; no cross-tab sync in this epic.

**Mock:** logout deletes that refresh token (`204` or `{ ok: true }`). A refresh with a revoked, expired, or unknown token is `401`. Other refresh tokens for the same customer keep working.

### RT-4 Tests

- Login / register persist refresh token + customer in `localStorage` and access token in `sessionStorage`; a later customer call sends the access token as Bearer.
- New-tab case: only `localStorage` populated → first customer call refreshes, then succeeds.
- A customer call that `401`s once refreshes, retries, succeeds.
- Two overlapping `401`s share one refresh call.
- Refresh `401` clears both storages and the shopper is treated as signed out (e.g. `/account` → `/login`).
- Sign out posts the refresh token and clears the session; a failed logout still clears it.
- Legacy `{ token, customer }` in `sessionStorage` is signed out.
- Mock: expiry at 15 min / 24 h, logout revokes one session only, admin envelope unchanged.

Tests under `test/` mirroring `src/`. Vitest + Testing Library.
