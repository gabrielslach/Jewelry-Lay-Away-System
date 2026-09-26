# Mine Credit — Internal Storefront API v1 (draft contract)

**Status:** draft contract for frontend build-against (Sep 23, 2026) — backend is being built to this spec in parallel — **v1.9**
**Audience:** Frontend Dev 1
**Scope:** everything the storefront and admin panel need from The Loft's own backend

**Important:** this is **our own backend's API**, not the client's inventory provider API. The frontend never calls the inventory provider's API directly — no CORS, key-authenticated, server-only (see Design & Architecture Section 4.3). Everything below is what the frontend actually talks to.

---

## 1. Connection

| | |
|---|---|
| Base URL | `https://honeydew-stork-999262.hostingersite.com` (sandbox — will move before go-live) |
| Auth | **Changed (Sep 26):** `register`/`login` now return `{ access_token, refresh_token, customer }` instead of a single `token`. Use `access_token` as the `Authorization: Bearer <access_token>` header — same as before, just a new field name. `access_token` expires in **15 minutes**; when a request 401s because of that, call `POST /api/customers/refresh` with `{ refresh_token }` to get a new `access_token` (no re-login needed). `refresh_token` itself is valid for **24 hours**, or until `/api/customers/logout` is called with it. A missing/invalid access token returns `401`. |
| Rate limiting | `register`/`login` (both customer and admin) are rate-limited to 10 attempts per 15 minutes per IP — a `429` with `{ error }` means "too many attempts," not a real validation error. Handle it distinctly in the UI (e.g. "please wait a few minutes") rather than showing it as a wrong-password message. |
| Protocol | HTTPS (prod), JSON, UTF-8 |

---

## 2. Storefront-facing endpoints

| Method | Endpoint | Status | Purpose |
|---|---|---|---|
| GET | `/api/gallery` | ✅ Live | List browsable pieces (proxies the client's catalog through our adapter). Query params: `page`, `page_size` (no `category` filter — see Section 5) |
| GET | `/api/gallery/:id` | ✅ Live | Single piece detail |
| POST | `/api/customers/register` | ✅ Live | Customer registration. Body now also accepts `phone` (optional). Returns `{ access_token, refresh_token, customer }` — see Section 5 |
| POST | `/api/customers/login` | ✅ Live | Customer login — returns `{ access_token, refresh_token, customer }` |
| POST | `/api/customers/refresh` | ✅ Live (Sep 26) — no auth header, body: `{ refresh_token }` | Exchange a still-valid refresh token for a new `access_token`. Rate-limited the same as register/login. Returns `{ access_token }` |
| POST | `/api/customers/logout` | ✅ Live (Sep 26) — body: `{ refresh_token }` | Revokes that one refresh token (that device/session only, not every session the customer has) |
| GET | `/api/customers/me` | ✅ Live (Sep 26) — **requires** `Authorization: Bearer <access_token>` | New — the customer's own profile (same shape as `customer` in register/login). Id comes from the token |
| GET | `/api/customers/orders` | ✅ Live — **requires** `Authorization: Bearer <access_token>` | **Path changed (Sep 26): no longer `/:id/orders` — the customer id now comes from the access token, not a route param.** Customer's lay-away order history (My Account page). **Enriched further (Sep 26):** each order now also nests an `installments` array (id, due_date, amount, status, paid_at) and adds `plan_label` (e.g. `"3 Mo. / 6 Payments"`) and `completed_on` (date of the last payment, once completed) — no per-plan fetch needed to render this page. Existing `on_track`/`overdue`/`completed` status values and numeric ids are unchanged. See Section 5 for the full shape. |

## 3. Lay-away & checkout endpoints

| Method | Endpoint | Status | Purpose |
|---|---|---|---|
| POST | `/api/layaway/plans` | ✅ Live (Sep 23) — **requires auth** | Create a lay-away plan. Body: `{ product_id, term_months (max is now configurable — see `/api/admin/settings`, defaults to 3), installment_dates: [ "YYYY-MM-DD", ... ] }`. `customer_id` comes from the token, not the body. Returns `{ id, total_price, currency, term_months, installments, note? }` — `note` is present when no markup rule is configured yet, meaning `total_price` is still the raw unmarked-up price (WBS M1). Build the checkout flow against this now; the price shown may still shift once markup lands. **Fixed (Sep 26):** installment amounts are now guaranteed to sum exactly to `total_price` — only the last installment absorbs any rounding remainder (previously each installment rounded independently, which could leave the sum a centavo or two off). **`installment_dates` is now validated server-side (Sep 26):** any date in the past, non-ascending/duplicate dates, more than 24 installments, or a last date beyond `term_months` from today returns `400 { "error": "<specific reason>" }`. Build the date-picker UI to keep customers within these bounds rather than relying on the client to enforce them (they weren't checked server-side before today). |
| GET | `/api/layaway/plans/:id` | ✅ Live | Plan detail — now includes an `installments` array (id, due_date, amount, status, paid_at). **`status` can now be `overdue`** (Sep 23 addition) — any `pending` installment past its `due_date` flips to `overdue` the moment this endpoint is read (no background job; it happens lazily on read). Show this distinctly from `pending` in the UI (e.g. My Account, checkout confirmation). |
| POST | `/api/layaway/plans/:id/payments` | 🚫 Returns `501` | **Gateway** path only — blocked on gateway confirmation (WBS M1) |
| POST | `/api/layaway/plans/:id/payments/manual` | ✅ Live (Sep 23) — **requires auth**, `multipart/form-data` | **Manual bank-transfer path** (Sep 23 addition — runs alongside the gateway, not a replacement). Fields: `installment_id`, `bank_account_id`, `proof_of_payment` (image file). Returns `{ id, status: 'submitted', note }` — stays pending until an admin manually confirms it; poll/refresh the plan to see status change. **Confirmed (Sep 26): this confirm/reject-of-proof flow is the actual "mark payment received" feature — there is no separate no-proof admin action.** Every payment on the books goes through this path (`POST /api/admin/payments/:id/confirm` or `/reject`, Section 4). |
| GET | `/api/bank-accounts` | ✅ Live (Sep 23) — public, no auth | List of AlMar Corp's bank accounts for the manual payment path: `{ id, bank_name, account_name, account_number, qr_code_url }`. Show this on checkout as the manual-payment option alongside the gateway option |

## 4. Admin panel endpoints

All admin endpoints below now require an admin token — `POST /api/admin/login` returns `{ access_token, refresh_token, admin }` (Sep 26 — same access/refresh split as customer auth, above; separate token pair from customer auth). `POST /api/admin/refresh` and `POST /api/admin/logout` work the same way as their customer equivalents. Admin registration is bootstrap-only, see the backend README.

| Method | Endpoint | Status | Purpose |
|---|---|---|---|
| GET | `/api/finance/ledger` | ✅ Live — **requires admin auth** | Finance/accounting ledger view |
| GET | `/api/admin/plans` | ✅ Live (Sep 23, enriched Sep 26) — **requires admin auth** | All lay-away plans across every customer, with `customer_name`, `customer_email`, `overdue_count`/`pending_count`/`paid_count`, and now `item_name` and `next_due_date` per plan — this is the data source for the admin orders/dashboard page |
| GET | `/api/admin/customers` | ✅ Live (Sep 26) — **requires admin auth** | New — admin customer directory. Returns every customer with `phone`, `member_since`, and `active_layaway_count`. See Section 5 for the shape |
| GET | `/api/admin/dashboard` | ✅ Live (Sep 26) — **requires admin auth** | New — single call for the admin dashboard summary: `collected_this_month`, a 6-week collections trend, and a merged `recent_activity` feed (new reservations, payments received, overdue installments, new customers — newest 10). See Section 5 for the shape |
| GET | `/api/admin/settings` | ✅ Live (Sep 26) — **requires admin auth** | New — business settings (single row): `business_name`, `max_term_months`, `penalty_per_day`, `require_full_payment_before_release`, `send_sms_reminders`, `allow_customer_selected_due_dates`. `max_term_months` is now the real cap enforced on plan creation (Section 3) |
| PUT | `/api/admin/settings` | ✅ Live (Sep 26) — **requires admin auth** | New — update any subset of the fields above; only send the fields that changed |
| POST/GET | `/api/admin/markup-rules` | ✅ Live — **requires admin auth** | Store/list markup rules (generic JSON — real values still pending WBS M1, but the mechanism works now) |
| POST/GET | `/api/admin/penalty-rules` | ✅ Live — **requires admin auth** | Store/list penalty rules (same pattern) |
| POST | `/api/bank-accounts` | ✅ Live — **requires admin auth**, `multipart/form-data` | Create a bank account for the manual payment path (Section 3). Fields: `bank_name`, `account_name`, `account_number`, `qr_code` (image file) |
| GET | `/api/admin/payments/pending` | ✅ Live — **requires admin auth** | List manual payment submissions awaiting confirmation |
| GET | `/api/admin/payments/:id/proof` | ✅ Live — **requires admin auth** | View a submission's uploaded proof-of-payment image |
| POST | `/api/admin/payments/:id/confirm` | ✅ Live — **requires admin auth** | Confirm a submission — marks the installment paid, writes a ledger entry, and completes the plan if it was the last installment |
| POST | `/api/admin/payments/:id/reject` | ✅ Live — **requires admin auth** | Reject a submission. Body: `{ reason? }` |
| DELETE | `/api/admin/customers/:id/sessions` | ✅ Live (Sep 26) — **requires admin auth** | New — revoke every active refresh token for that customer (stolen device, disabled account, or a "log out everywhere" support request) |

---

## 5. Response shapes — confirmed against the live sandbox

**`GET /api/gallery`** — paginated envelope, not a bare array:

```json
{
  "count": 718,
  "next": "/api/gallery?page=2&page_size=50",
  "previous": null,
  "results": [
    {
      "id": 6961,
      "title": "PJ17414",
      "price": "588.33",
      "currency": "USD",
      "in_stock": true,
      "images": [{ "url": "https://...", "is_primary": true }]
    }
  ]
}
```

`next`/`previous` are relative paths on **this API**, not the provider's — always safe to fetch directly.

**`GET /api/gallery/:id`** — the same single object shown inside `results` above.

**Confirmed (Sep 24, 2026) — gallery field set is final for now:** `title` is the barcode/PJ number (never the provider's `name` field, which is a shared style label covering 100+ products, not a unique title). There is **no `category` field** — client confirmed category/colour/quality/stone/metal are placeholder/blank across essentially the whole catalog today and will be added back once that data is real. Don't build UI around a category filter or badge for now.

**Known open issue, not a frontend concern:** `currency` is inconsistent across items (mostly `PHP`, some `USD`) — this is a client data question being raised with the client's team (WBS M1), not something to build a fix for yet. Just don't assume `currency` is always `PHP`.

Price/markup logic is still unresolved (WBS M1) — `price` above is the provider's raw `selling_price`, unmarked-up.

**`POST /api/customers/register`** / **`POST /api/customers/login`** (Sep 26 — full response, not just `customer`):

```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "6e1f3118512ae3c2f1df4f87220a7feb...",
  "customer": {
    "id": 15,
    "name": "Rounding Test",
    "email": "roundingtest@example.com",
    "phone": "09171234567",
    "created_at": "2026-09-26T02:02:08.000Z"
  }
}
```

`phone` is `null` if not supplied at registration. `created_at` is "member since." `GET /api/customers/me` returns just the `customer` object above, same shape.

**`POST /api/customers/refresh`**:

```json
{ "access_token": "eyJhbGciOi..." }
```

`401 { "error": "Invalid, expired, or revoked refresh token" }` if the refresh token is expired, wrong, or was already logged out — treat this as "please log in again."

**`GET /api/customers/orders`** (Sep 26 — enriched further, array of these):

```json
{
  "id": 8,
  "item_name": "PJ21125",
  "term_months": 3,
  "plan_label": "3 Mo. / 3 Payments",
  "installment_count": 3,
  "next_due_date": "2026-10-01T00:00:00.000Z",
  "total_price": "37400.00",
  "currency": "PHP",
  "status": "on_track",
  "plan_status": "active",
  "completed_on": null,
  "created_at": "2026-09-26T02:02:10.000Z",
  "installments": [
    { "id": 22, "due_date": "2026-10-01T00:00:00.000Z", "amount": "12466.67", "status": "pending", "paid_at": null },
    { "id": 23, "due_date": "2026-11-01T00:00:00.000Z", "amount": "12466.67", "status": "pending", "paid_at": null },
    { "id": 24, "due_date": "2026-12-01T00:00:00.000Z", "amount": "12466.66", "status": "pending", "paid_at": null }
  ]
}
```

`status` is `on_track`, `overdue` (at least one installment past due), or `completed`. `next_due_date` is `null` once completed. `completed_on` is the date of the last installment paid, only set once `status` is `completed`. `plan_label` and each installment's fields are convenience/display fields — not new data, just avoiding a second fetch per plan.

**`GET /api/admin/customers`** (Sep 26, array of these):

```json
{
  "id": 15,
  "name": "Rounding Test",
  "email": "roundingtest@example.com",
  "phone": "09171234567",
  "member_since": "2026-09-26T02:02:08.000Z",
  "active_layaway_count": 1
}
```

**`GET /api/admin/dashboard`** (Sep 26):

```json
{
  "collected_this_month": { "total": 37400, "currency": "PHP" },
  "collections_last_6_weeks": [
    { "week_start": "2026-08-16", "total": 0 },
    { "week_start": "2026-08-23", "total": 0 },
    { "week_start": "2026-09-20", "total": 37400 }
  ],
  "recent_activity": [
    { "label": "New reservation", "detail": "Rounding Test - plan #8", "timestamp": "2026-09-26T02:02:10.000Z" },
    { "label": "Payment received", "detail": "₱37400.00", "timestamp": "2026-09-23T15:09:59.000Z" },
    { "label": "New customer", "detail": "Rounding Test", "timestamp": "2026-09-26T02:02:08.000Z" }
  ]
}
```

`collections_last_6_weeks` always has exactly 6 entries (oldest first), zero-filled for weeks with no collections. `recent_activity` is newest-first, capped at 10, merged across reservations/payments/overdue/new-customer events.

**`GET /api/admin/settings`**:

```json
{
  "id": 1,
  "business_name": "Mine Credit",
  "max_term_months": 3,
  "penalty_per_day": null,
  "require_full_payment_before_release": 1,
  "send_sms_reminders": 0,
  "allow_customer_selected_due_dates": 1,
  "updated_at": "2026-09-25T17:56:54.000Z"
}
```

`penalty_per_day` is `null` until the real rate lands (WBS M1) — same placeholder pattern as `/api/admin/penalty-rules`.

---

## 6. What frontend does NOT need to worry about

- Calling the inventory provider's API directly — never happens, ever, from frontend code
- The API key — stays server-side only, frontend never sees it
- Markup/penalty computation logic — backend applies this before data reaches the frontend
- Payment gateway credentials — backend-owned

---

*This document is confidential and proprietary to The Loft IT Solutions.*
*Version 1.9 — Updated Sep 26, 2026 (Frontend Dev 1 flagged): `POST /api/layaway/plans` now validates `installment_dates` server-side — previously fully client-trusted, so a modified client could submit backdated dates, a schedule past the max term, or an excessive installment count. Rejects with `400` and a specific message: dates in the past, non-ascending/duplicate dates, more than 24 installments, or a last date beyond `term_months` from today. No change to valid requests.*
*Version 1.8 — Updated Sep 26, 2026 (Frontend Dev 1 request): **breaking change** — `register`/`login` now return `{ access_token, refresh_token, customer }` instead of `{ token, customer }`; added `POST /api/customers/refresh` and `/logout`; added `GET /api/customers/me`. **Path change** — `GET /api/customers/:id/orders` is now `GET /api/customers/orders` (id comes from the access token). `/orders` now nests an `installments` array per plan and adds `plan_label`/`completed_on` — kept existing numeric ids and `on_track`/`overdue`/`completed` status values rather than the frontend's mockup format. Admin login/refresh/logout got the same access/refresh split, plus a new `DELETE /api/admin/customers/:id/sessions` to revoke a customer's sessions.*
*Version 1.7 — Updated Sep 26, 2026: removed two client contact names that had slipped into Section 5 and the v1.5 changelog entry — no content/behavior change, redaction only.*
*Version 1.6 — Updated Sep 26, 2026: added `phone`/`created_at` to customer register/login response; enriched `/api/customers/:id/orders` with `item_name`, `next_due_date`, `installment_count`, rolled-up `status`; added `GET /api/admin/customers` (customer directory), `GET /api/admin/dashboard` (summary + 6-week trend + recent activity), `GET`/`PUT /api/admin/settings` (business settings, now enforcing `max_term_months` on plan creation instead of a hardcoded 3); enriched `/api/admin/plans` with `item_name`/`next_due_date`; fixed installment-amount rounding so the sum always matches `total_price` exactly; confirmed the manual-payment confirm/reject-of-proof flow is the only "mark paid" mechanism (answering Frontend Dev 1's open question).*
*Version 1.5 — Updated Sep 24, 2026: gallery field set confirmed final (client's API dev) — removed `category` from `/api/gallery`'s query params and response example; documented that `title` is barcode-based and that category/colour/quality/stone/metal are intentionally absent (placeholder data client-side), not a frontend gap to fix.*
*Version 1.4 — Updated Sep 23, 2026, later same day: added rate-limiting behavior (Section 1 — `429` on too many login/register attempts); documented the new `overdue` installment status (Section 3, lazy on plan read); added `GET /api/admin/plans` (Section 4), the data source for the admin dashboard/orders page.*
*Version 1.3 — Updated Sep 23, 2026, later same day: added the manual (non-gateway) payment path — `POST /api/layaway/plans/:id/payments/manual` and `GET /api/bank-accounts` — which runs alongside the still-blocked gateway path (correction, not a client change). All admin endpoints (`/api/finance/ledger`, `/api/admin/markup-rules`, `/penalty-rules`, and the new `/api/bank-accounts` POST and `/api/admin/payments/*`) now require an admin token, not left open.*
*Version 1.2 — Updated Sep 23, 2026, later same day: auth is now enforced on protected routes (401/403, no longer "coming soon") — build UI logic assuming this. Lay-away plan creation (`POST /api/layaway/plans`) is now live, not a 501 stub — added the request/response shape and the pending-markup `note` field. Plan detail now includes the full `installments` array.*
*Version 1.1 — Updated Sep 23, 2026, same day, after live sandbox testing: added the real deployed base URL (was "TBD"); corrected `/api/gallery`'s response shape from a bare object to the actual paginated envelope (`count`/`next`/`previous`/`results`); added missing query params; added a Status column marking which endpoints are live vs. intentionally stubbed with `501` (so a 501 isn't mistaken for a broken integration); clarified that auth middleware isn't wired up yet; flagged the mixed-currency data as a known client-side open item, not a frontend bug to fix.*
*Version 1.0 — Initial draft contract, created Sep 23, 2026 (downpayment received, development starting) to unblock Frontend Dev 1's Phase 1 work while backend endpoints are built in parallel. Will be updated as real response shapes firm up.*
*End of Document*