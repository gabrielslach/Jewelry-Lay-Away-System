# Mine Credit — Internal Storefront API v1 (draft contract)

**Status:** draft contract for frontend build-against (Sep 23, 2026) — backend is being built to this spec in parallel
**Audience:** Frontend Dev 1
**Scope:** everything the storefront and admin panel need from The Loft's own backend

**Important:** this is **our own backend's API**, not the client's inventory provider API. The frontend never calls the inventory provider's API directly — no CORS, key-authenticated, server-only (see Design & Architecture Section 4.3). Everything below is what the frontend actually talks to.

---

## 1. Connection

| | |
|---|---|
| Base URL | `https://honeydew-stork-999262.hostingersite.com` (sandbox — will move before go-live) |
| Auth | `/customers/login` returns a JWT as `token`. **Now enforced (Sep 23):** protected routes require `Authorization: Bearer <token>` — a missing/invalid token returns `401`, and a token for the wrong customer returns `403`. Build UI logic assuming this now. |
| Rate limiting | `register`/`login` (both customer and admin) are rate-limited to 10 attempts per 15 minutes per IP — a `429` with `{ error }` means "too many attempts," not a real validation error. Handle it distinctly in the UI (e.g. "please wait a few minutes") rather than showing it as a wrong-password message. |
| Protocol | HTTPS (prod), JSON, UTF-8 |

---

## 2. Storefront-facing endpoints

| Method | Endpoint | Status | Purpose |
|---|---|---|---|
| GET | `/api/gallery` | ✅ Live | List browsable pieces (proxies the client's catalog through our adapter). Query params: `page`, `page_size` (no `category` filter — see Section 5) |
| GET | `/api/gallery/:id` | ✅ Live | Single piece detail |
| POST | `/api/customers/register` | ✅ Live | Customer registration |
| POST | `/api/customers/login` | ✅ Live | Customer login — returns `{ token, customer }` |
| GET | `/api/customers/:id/orders` | ✅ Live — **requires** `Authorization: Bearer <token>` for that same customer | Customer's lay-away order history (My Account page) |

## 3. Lay-away & checkout endpoints

| Method | Endpoint | Status | Purpose |
|---|---|---|---|
| POST | `/api/layaway/plans` | ✅ Live (Sep 23) — **requires auth** | Create a lay-away plan. Body: `{ product_id, term_months (max 3), installment_dates: [ "YYYY-MM-DD", ... ] }`. `customer_id` comes from the token, not the body. Returns `{ id, total_price, currency, term_months, installments, note? }` — `note` is present when no markup rule is configured yet, meaning `total_price` is still the raw unmarked-up price (WBS M1). Build the checkout flow against this now; the price shown may still shift once markup lands. |
| GET | `/api/layaway/plans/:id` | ✅ Live | Plan detail — now includes an `installments` array (id, due_date, amount, status, paid_at). **`status` can now be `overdue`** (Sep 23 addition) — any `pending` installment past its `due_date` flips to `overdue` the moment this endpoint is read (no background job; it happens lazily on read). Show this distinctly from `pending` in the UI (e.g. My Account, checkout confirmation). |
| POST | `/api/layaway/plans/:id/payments` | 🚫 Returns `501` | **Gateway** path only — blocked on gateway confirmation (WBS M1) |
| POST | `/api/layaway/plans/:id/payments/manual` | ✅ Live (Sep 23) — **requires auth**, `multipart/form-data` | **Manual bank-transfer path** (Sep 23 addition — runs alongside the gateway, not a replacement). Fields: `installment_id`, `bank_account_id`, `proof_of_payment` (image file). Returns `{ id, status: 'submitted', note }` — stays pending until an admin manually confirms it; poll/refresh the plan to see status change |
| GET | `/api/bank-accounts` | ✅ Live (Sep 23) — public, no auth | List of AlMar Corp's bank accounts for the manual payment path: `{ id, bank_name, account_name, account_number, qr_code_url }`. Show this on checkout as the manual-payment option alongside the gateway option |

## 4. Admin panel endpoints (Phase 2, not needed for Phase 1 frontend work)

All admin endpoints below now require an admin token — `POST /api/admin/login` returns `{ token, admin }` (separate from customer auth; admin registration is bootstrap-only, see the backend README).

| Method | Endpoint | Status | Purpose |
|---|---|---|---|
| GET | `/api/finance/ledger` | ✅ Live — **requires admin auth** | Finance/accounting ledger view |
| GET | `/api/admin/plans` | ✅ Live (Sep 23) — **requires admin auth** | All lay-away plans across every customer, with `customer_name`, `customer_email`, and `overdue_count`/`pending_count`/`paid_count` per plan — this is the data source for the admin dashboard/orders page |
| POST/GET | `/api/admin/markup-rules` | ✅ Live — **requires admin auth** | Store/list markup rules (generic JSON — real values still pending WBS M1, but the mechanism works now) |
| POST/GET | `/api/admin/penalty-rules` | ✅ Live — **requires admin auth** | Store/list penalty rules (same pattern) |
| POST | `/api/bank-accounts` | ✅ Live — **requires admin auth**, `multipart/form-data` | Create a bank account for the manual payment path (Section 3). Fields: `bank_name`, `account_name`, `account_number`, `qr_code` (image file) |
| GET | `/api/admin/payments/pending` | ✅ Live — **requires admin auth** | List manual payment submissions awaiting confirmation |
| GET | `/api/admin/payments/:id/proof` | ✅ Live — **requires admin auth** | View a submission's uploaded proof-of-payment image |
| POST | `/api/admin/payments/:id/confirm` | ✅ Live — **requires admin auth** | Confirm a submission — marks the installment paid, writes a ledger entry, and completes the plan if it was the last installment |
| POST | `/api/admin/payments/:id/reject` | ✅ Live — **requires admin auth** | Reject a submission. Body: `{ reason? }` |

---

## 5. Response shapes — confirmed against the live sandbox (Sep 23, 2026)

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

**Known open issue, not a frontend concern:** `currency` is inconsistent across items (mostly `PHP`, some `USD`) — this is a client data question being raised with Alvin (WBS M1), not something to build a fix for yet. Just don't assume `currency` is always `PHP`.

Price/markup logic is still unresolved (WBS M1) — `price` above is the provider's raw `selling_price`, unmarked-up.

---

## 6. What frontend does NOT need to worry about

- Calling the inventory provider's API directly — never happens, ever, from frontend code
- The API key — stays server-side only, frontend never sees it
- Markup/penalty computation logic — backend applies this before data reaches the frontend
- Payment gateway credentials — backend-owned

---

*This document is confidential and proprietary to The Loft IT Solutions.*
*Version 1.5 — Updated Sep 24, 2026: gallery field set confirmed final (client API dev Jeffmathew) — removed `category` from `/api/gallery`'s query params and response example; documented that `title` is barcode-based and that category/colour/quality/stone/metal are intentionally absent (placeholder data client-side), not a frontend gap to fix.*
*Version 1.4 — Updated Sep 23, 2026, later same day: added rate-limiting behavior (Section 1 — `429` on too many login/register attempts); documented the new `overdue` installment status (Section 3, lazy on plan read); added `GET /api/admin/plans` (Section 4), the data source for the admin dashboard/orders page.*
*Version 1.3 — Updated Sep 23, 2026, later same day: added the manual (non-gateway) payment path — `POST /api/layaway/plans/:id/payments/manual` and `GET /api/bank-accounts` — which runs alongside the still-blocked gateway path (correction, not a client change). All admin endpoints (`/api/finance/ledger`, `/api/admin/markup-rules`, `/penalty-rules`, and the new `/api/bank-accounts` POST and `/api/admin/payments/*`) now require an admin token, not left open.*
*Version 1.2 — Updated Sep 23, 2026, later same day: auth is now enforced on protected routes (401/403, no longer "coming soon") — build UI logic assuming this. Lay-away plan creation (`POST /api/layaway/plans`) is now live, not a 501 stub — added the request/response shape and the pending-markup `note` field. Plan detail now includes the full `installments` array.*
*Version 1.1 — Updated Sep 23, 2026, same day, after live sandbox testing: added the real deployed base URL (was "TBD"); corrected `/api/gallery`'s response shape from a bare object to the actual paginated envelope (`count`/`next`/`previous`/`results`); added missing query params; added a Status column marking which endpoints are live vs. intentionally stubbed with `501` (so a 501 isn't mistaken for a broken integration); clarified that auth middleware isn't wired up yet; flagged the mixed-currency data as a known client-side open item, not a frontend bug to fix.*
*Version 1.0 — Initial draft contract, created Sep 23, 2026 (downpayment received, development starting) to unblock Frontend Dev 1's Phase 1 work while backend endpoints are built in parallel. Will be updated as real response shapes firm up.*
*End of Document*