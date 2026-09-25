# Build guide — epics and features

Step-by-step outline for the Sample Jewelry Co. React SPA. Visual and copy target is [`demo.html`](demo.html). Data contract is [`api-definition.md`](api-definition.md). Gaps and mocks are listed in [`tech-debt.md`](tech-debt.md).

**How we build:** pick **one feature id** (for example `SF-1`) → implement against the demo look + API or mock → reviewer on the real diff → Gabriel decides. Do not commit unless asked.

**Product rules**
- Match demo screens as closely as possible (layout and copy). Sample Jewelry Co. palette, fonts, and icons are the **default theme**, not values to repeat inside each epic.
- Mock anything the live API cannot back; record it in `tech-debt.md`.
- The HTML demo’s Storefront / Admin switcher and landing chooser are **not** product features. The SPA uses routes.
- My Account is a **page**, not a modal (demo used `#myAccountModalBackdrop`).

---

## Foundation (do first)

Shared work the three epics assume. `F-1` is a **swappable design system**: rebranding (client colors, fonts, images/icons) should mean editing the theme layer, not hunting through page components.

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

Keep React Router. Grow routes as features land: `/` storefront, `/account` my account, `/admin/*` admin.

---

## Epic 1 — Storefront (`/`)

Public marketing, gallery, piece detail, and lay-away checkout from `#publicView` plus the product and checkout modals.

### SF-1 Public chrome

Sticky nav (logo, Collections / How Lay-Away Works / Reviews / Contact), My Account + Start a Lay-Away, hamburger + mobile panel, footer `#contact` (Shop / Support / Company columns, demo disclaimer).

### SF-2 Hero

Eyebrow, headline, subcopy, Browse Collections, three stats (3,000+ pieces, 3 Mo. max term, Your Dates). Demo `.hero`.

### SF-3 Collections gallery

Card grid: media, category, name, price + “as low as …/payment”, View Details. Demo `#collections` / `#galleryGrid`.

- **API:** `GET /api/gallery` (`count` / `next` / `previous` / `results`).
- **Mock:** category badge, jewelry display name, PHP-style price presentation so cards match the demo. API `title` is a barcode; there is no `category`. See tech-debt.

### SF-4 How it works

Three static steps from demo `#how` (choose piece → set schedule → complete & collect). No API.

### SF-5 Reviews

Three static testimonials from demo `#reviews`. No API.

### SF-6 Piece detail

Demo product modal: media, category, price, spec grid (material, stone, size, certification), Close + Reserve This Piece.

- **API:** `GET /api/gallery/:id`.
- **Mock:** spec fields the gallery object does not return.

### SF-7 Checkout — schedule

Step 1: lay-away term select + per-payment dates and amounts. Demo `#checkoutStep1` (1 / 2 / 3 months → 2 / 4 / 6 payments).

- **API:** `POST /api/layaway/plans` with `product_id`, `term_months` (max 3), `installment_dates` — requires customer JWT.
- **Mock:** plan create (and session) until auth exists. Keep demo term options even if the API shape is `term_months` + dates.

### SF-8 Checkout — payment method

Step 2: GCash / E-Wallet, Bank Transfer, Credit / Debit Card. Demo `#checkoutStep2`.

- **API:** gateway `POST .../payments` is `501`. Manual path: `GET /api/bank-accounts`, `POST /api/layaway/plans/:id/payments/manual`.
- **Mock:** GCash and card (and bank until the manual path is wired). Record unused live payment APIs in tech-debt.

### SF-9 Checkout — confirmation

Step 3 success copy + Done + toast (“Reservation submitted…”). Demo `#checkoutStep3`.

---

## Epic 2 — My Account (`/account`)

Same content as the demo My Account modal, as a full page.

### AC-1 Account shell

Page title “My Account”, summary grid: name, email, active lay-away count, member since. Demo assumes signed-in **Sample Client**.

- **API (later):** `POST /api/customers/login`, `GET /api/customers/:id/orders` (Bearer token).
- **Mock:** session and profile fields. Demo has no login/register UI.

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

Internal staff UI from `#adminView` plus order and customer modals. The API doc calls this Phase 2; we still build the **screens**. Bind live admin endpoints where they fit; mock the rest.

### AD-1 Admin chrome

Sidebar: Dashboard, Orders & Installments, Customers, Settings. Sticky topbar title, decorative search + bell. Mobile sidebar + backdrop.

Nested routes: `/admin`, `/admin/orders`, `/admin/customers`, `/admin/settings`.

No API (chrome only). Search and notifications are visual until an API exists.

### AD-2 Dashboard KPIs

Four cards: active lay-aways, collected this month, overdue payments, active customers. Demo `.kpi-row`.

- **API:** approximate counts from `GET /api/admin/plans` (and ledger if useful).
- **Mock:** collected-this-month and any KPI the plans list cannot support.

### AD-3 Dashboard panels

“Collections — Last 6 Weeks” bar chart and “Recent Activity” list. Demo is static sample data — **mock**.

### AD-4 Orders table

Filters All / On Track / Overdue. Columns: Order, Customer, Item, Plan, Next Due, Status, View.

- **API:** `GET /api/admin/plans` (`customer_name`, `customer_email`, `overdue_count` / `pending_count` / `paid_count`).

### AD-5 Order detail

Modal/panel: customer, item, plan, status, installment schedule, **Mark Next Payment Received**.

- **API analog:** `GET /api/admin/payments/pending`, proof, confirm/reject.
- **Mock:** if the demo one-click “mark next paid” does not map 1:1 to those endpoints.

### AD-6 Customers table

Name, email, active lay-aways, member since, View.

- **API:** no customer-directory endpoint — **mock** demo rows or derive unique customers from plans.

### AD-7 Customer detail

Email, mobile, active lay-aways, member since.

- **Mock:** mobile and member since (not in the API contract).

### AD-8 Settings

Business name, maximum lay-away term (months), late payment penalty, toggles (full payment before release, SMS reminders, customer-selected due dates), Save Changes + toast.

- **Mock:** persistence.
- Live `markup-rules`, `penalty-rules`, and `POST /api/bank-accounts` are **not** this screen; list them in tech-debt as unused by the demo UI.
