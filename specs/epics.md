# Build guide — epics and features

Step-by-step outline for the Sample Jewelry Co. React SPA. Visual and copy target is [`demo.html`](demo.html). Data contract is [`api-definition.md`](api-definition.md). Gaps and mocks are listed in [`tech-debt.md`](tech-debt.md). Spec edits are logged in [`CHANGELOG.md`](CHANGELOG.md).

**How we build:** pick **one feature id** (for example `SF-1`) → implement against the demo look + API or mock → reviewer on the real diff → Gabriel decides. Do not commit unless asked.

**Mock API:** local HTTP fixtures live in **Epic 4**. Feature code talks to **Epic 6** services, not raw `fetch` in components and not new in-memory `src/data` stubs. Invented endpoints stay documented under Epic 4 until they exist on the live backend.

**Product rules**
- Match demo screens as closely as possible (layout and copy). Sample Jewelry Co. palette, fonts, and icons are the **default theme**, not values to repeat inside each epic.
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

Sticky nav (logo, Collections / How Lay-Away Works / Reviews / Contact), My Account + Start a Lay-Away, hamburger + mobile panel, footer `#contact` (Shop / Support / Company columns, demo disclaimer).

“Collections” in the nav goes to `/collections` once Epic 8 lands (until then, in-page `#collections` is fine).

### SF-2 Hero

Eyebrow, headline, subcopy, Browse Collections, three stats (3,000+ pieces, 3 Mo. max term, Your Dates). Demo `.hero`.

**Superseded for new work by Epic 10** (home hero carousel). Do not extend the single stacked text block; replace it when Epic 10 is approved.

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

- **API / service:** `GET /api/customers/:id/orders` (Bearer token) after login (Epic 5).
- **Mock:** `phone` / `member_since` until the live customer object includes them.

### AC-2 Active lay-aways

Card per plan: item name, On Track / Overdue badge, plan label, order id, next due, installment schedule rows.

- **API:** customer orders list + `GET /api/layaway/plans/:id` (`installments`, `status` including `overdue`).
- **Mock:** list shape, badges, and schedule if the list payload is thinner than the demo cards.

### AC-3 Completed lay-aways

Completed rows (item, plan, “Completed {date}”) or empty copy from the demo.

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
| POST | `/api/customers/login` | `{ token, customer }`; same rate limit. Seed **Sample Client**. |
| GET | `/api/customers/:id/orders` | Bearer for that customer; `401` / `403` otherwise. Include active **and** completed plans so AC-2 / AC-3 work. Mock-only list fields as needed: item name, plan label, next due, On Track / Overdue. |

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
`POST /api/dev/session/customer` — no body, or `{ email }` defaulting to Sample Client. Returns the same `{ token, customer }` as login.

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
`GET` and `PUT /api/admin/settings`: `business_name`, `max_term_months`, `late_penalty_per_day`, `require_full_payment_before_release`, `sms_reminders`, `customer_selected_due_dates`. Default to demo values (Sample Jewelry Co., 3, 50, all toggles on). In-memory persist for the process lifetime.

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

### AU-3 Session and gates

Persist customer JWT (memory + `sessionStorage` or equivalent). `/account` and `POST /api/layaway/plans` require it. Nav “My Account” goes to `/account` when signed in and `/login` when not. After AU-3, stop using `POST /api/dev/session/customer` in the SPA (mock may keep the route).

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
