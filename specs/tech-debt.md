# Tech debt — demo vs API

Inventory of what we **mock** to match [`demo.html`](demo.html), live APIs that have **no demo screen**, and **contract caveats**. Update this file when a mock is replaced with a real call or a new gap appears.

Source of truth for UI: the demo (plus Epic 5 / 8 / 9 screens the demo never had). Source of truth for real backend behavior: [`api-definition.md`](api-definition.md) (currently **v1.9**). Local HTTP doubles and invented demo-gap routes are **Epic 4** in [`epics.md`](epics.md) (`specs/mock-api.md` once that epic lands).

---

## Not yet built — v1.9 gives us a real endpoint or rule we still mock/invent

The Sep 26 update (v1.6–v1.9) turned several of our *invented* mocks into real endpoints, and changed two things we already ship. None of this is implemented yet — it's the concrete follow-up work.

| # | What changed | What we do today | Where |
| --- | --- | --- | --- |
| 1 | **Done (orders path):** `GET /api/customers/orders` (token, no `:id`), bare array, v1.9 fields. Service maps dates and `on_track`/`overdue`/`completed`. Live `item_name` is still the barcode. | Mock still uses jewelry names for demo fidelity. | AC-1, AC-2, AC-3 |
| 2 | **New:** `GET /api/customers/me` — customer's own profile by token, same shape as register/login's `customer`. | Not called anywhere. `Account.jsx` only has whatever `SessionProvider` cached at login. | AC-1 |
| 3 | **New:** admin auth is now access/refresh split too — `POST /api/admin/login` returns `{ access_token, refresh_token, admin }`, plus `POST /api/admin/refresh` / `/logout`. | Admin session code (`session.js` admin functions, `ensureAdminToken.js`, mock `/api/admin/login`) still uses a single `token`, same as before Epic 15. Admin has no refresh, so a long admin session will just start getting `401`s with no recovery. | AD-1 (none yet — no admin login screen), Epic 15 follow-up |
| 4 | **New:** `DELETE /api/admin/customers/:id/sessions` — revoke every refresh token for a customer (stolen device / support request). | Not called anywhere; no admin UI action for it. | AD-6, AD-7 |
| 5 | **Confirmed, not new:** the manual-payment **confirm/reject-of-proof** flow (`POST /api/admin/payments/:id/confirm` / `/reject`) is *the* only "mark paid" mechanism — there is no separate no-proof admin action, and none is coming. | AD-5's one-click **`POST /api/admin/plans/:id/mark-next-paid`** is still an invented mock with no live equivalent. It will need to become the confirm/reject + proof-image UI, not get a real backend swap-in. | AD-5 |
| 6 | **New real endpoint** for something we invented: `GET /api/admin/customers` (list only — `phone`, `member_since`, `active_layaway_count`). No live `GET /api/admin/customers/:id`. | Mock still serves our invented `GET /api/admin/customers/:id` too; the list fields already line up closely. | AD-6, AD-7 |
| 7 | **New real endpoint:** `GET /api/admin/dashboard` — `collected_this_month: { total, currency }`, `collections_last_6_weeks: [{ week_start, total }]` (always 6, zero-filled), `recent_activity: [{ label, detail, timestamp }]` (newest-first, capped 10). | Mock/invented shape uses different field names: bare number array for the 6 weeks, `{ title, detail }` for activity (not `label`), and no `currency` on the KPI. | AD-2, AD-3 |
| 8 | **New real endpoint:** `GET`/`PUT /api/admin/settings` — real field names are `business_name`, `max_term_months`, `penalty_per_day`, `require_full_payment_before_release`, `send_sms_reminders`, `allow_customer_selected_due_dates`. `max_term_months` is now the **real enforced cap** on `POST /api/layaway/plans`. | Our invented settings use different names (`late_penalty_per_day`, `sms_reminders`, `customer_selected_due_dates`) and checkout hardcodes term max **3** instead of reading the setting. | AD-8, SF-7 |
| 9 | **New validation:** `POST /api/layaway/plans` now rejects `installment_dates` server-side (`400` + reason) for: a past date, non-ascending/duplicate dates, more than 24 installments, or a last date beyond `term_months` from today. | Checkout's date picker doesn't enforce all of these client-side, and `Checkout.jsx` doesn't have distinct copy for a `400` from this endpoint (falls back to the generic `ServiceError` message). Mock server doesn't validate dates at all yet. | SF-7 |
| 10 | **Fixed server-side, no frontend change needed — but check the mock:** installment amounts on plan create now always sum exactly to `total_price` (only the last installment absorbs rounding). | Confirm `mock-server` does the same, so dev matches production rounding. | SF-7, MS-3 |
| 11 | **New optional field:** `POST /api/customers/register` now accepts `phone` in the body. | `Register.jsx` doesn't collect it; `phone` will stay `null` for every real signup until the form is updated. | AU-1 |

---

## Mocked to match the demo (or new storefront pages) — still open

Rows resolved by the v1.9 update (member since / phone, badges, completed list, dashboard KPI, dashboard chart + activity, customers directory, settings form) moved to the table above, since a real endpoint now exists and the follow-up is a code swap, not a standing mock. What's left below still has **no** live backend to switch to.

| Area | What we show | Why it is mocked | Related features |
| --- | --- | --- | --- |
| Gallery cards | Jewelry **name** + **category** badge | `GET /api/gallery` `title` is the barcode/PJ number, not a unique style name. There is **no `category`**. Client data for category/colour/quality/stone/metal is placeholder. | SF-3, SF-6, CL-1, PD-2 |
| Piece specs | Material, stone, size, certification | Not in the gallery field set. | SF-6, PD-2 |
| Price display | `₱` and “as low as ₱…/payment” | `currency` is mixed (`PHP` / `USD`). Markup is unresolved; `price` is raw provider `selling_price`. | SF-3, SF-6, SF-7, CL-1, PD-2 |
| Checkout terms | 1 / 2 / 3 months as 2 / 4 / 6 payments | API is `term_months` + `installment_dates[]`. Max term is now `/api/admin/settings.max_term_months` (see gap #8), not a hardcoded 3. | SF-7 |
| Pay: GCash / card | Radio options in checkout step 2 | `POST /api/layaway/plans/:id/payments` returns **501** (gateway blocked). Mock-gateway reserves only. | SF-8 |
| Pay: bank transfer | Same step, no QR / proof upload in demo | Live: `GET /api/bank-accounts`, `POST .../payments/manual` (multipart proof). Demo UI does not include that flow yet. | SF-8 |
| Admin search + bell | Topbar chrome | No search or notifications API. | AD-1 |
| Collections pagination | Full catalog with page controls | Live `GET /api/gallery` **is** paginated (`count` / `next` / `previous`). Mock must seed ≥24 items (`page_size` 12) so two pages exist. | CL-1, MS-2, MS-6 |
| Piece image carousel | Several photos, thumbs / swipe | Contract allows `images[]`, but sandbox items often have one URL or none. Mock seeds 2–4 placeholder images per piece. Empty list → gem placeholder. Do not invent extra live images. | PD-1, MS-2 |
| Catalog display extras beyond first six | Names, categories, specs for extra mock SKUs | Only the demo’s six pieces have canonical copy. Extra mock rows may reuse or invent display fields; they stay mock-only. | CL-1, PD-2 |

---

## Live API with no demo UI

These endpoints are in the contract (many already live) but **do not appear** as screens in `demo.html`. Login/register **do** have an SPA epic now (Epic 5) — still no demo mockup, so copy is ours.

| Endpoint | Purpose | SPA epic |
| --- | --- | --- |
| `POST /api/customers/register` | Customer registration; now also accepts `phone` (gap #11) | AU-1 |
| `POST /api/customers/login` | `access_token` + `refresh_token` + `customer` | AU-2, Epic 15 |
| `POST /api/customers/refresh` / `/logout` | Refresh and revoke a customer session | Epic 15 |
| `GET /api/customers/me` | Customer's own profile by token (gap #2) | not yet used |
| Rate limit `429` on register/login/refresh | Distinct UI (“please wait”) vs wrong password | AU-1, AU-2 |
| `POST /api/admin/login` / `/refresh` / `/logout` | Admin session, now access/refresh split (gap #3) | none (dev session helper) |
| `DELETE /api/admin/customers/:id/sessions` | Revoke a customer's sessions (gap #4) | not yet used |
| `GET /api/bank-accounts` (public) | Bank name, account, QR for manual pay | not in demo checkout |
| `POST /api/layaway/plans/:id/payments/manual` | Proof-of-payment upload; status `submitted` until admin confirms | not in demo checkout |
| `GET /api/finance/ledger` | Finance/accounting ledger | none |
| `POST`/`GET /api/admin/markup-rules` | Markup rules (values still pending WBS M1) | none |
| `POST`/`GET /api/admin/penalty-rules` | Penalty rules (same pattern; overlaps `settings.penalty_per_day`) | none |
| `POST /api/bank-accounts` | Admin create bank account + QR image | none |
| `GET /api/admin/payments/pending` | Manual submissions awaiting confirmation | none |
| `GET /api/admin/payments/:id/proof` | Proof image | none |
| `POST /api/admin/payments/:id/confirm` | Confirm → installment paid, ledger, maybe complete plan (the only "mark paid" path — gap #5) | none |
| `POST /api/admin/payments/:id/reject` | Reject with optional `reason` | none |

`GET /api/admin/plans` **does** map to the admin orders table (AD-4); it's now enriched with `item_name` and `next_due_date` too. `GET /api/gallery` pagination maps to Epic 8.

---

## Contract caveats (do not “fix” in the frontend)

- Frontend never calls the inventory provider; no API key in the browser.
- Gallery: no `category` query param or field — not a frontend gap to invent a real filter.
- `currency` inconsistency is a client data issue (WBS M1).
- Plan create may return `note` when no markup rule is configured — `total_price` may still be unmarked-up.
- Installment `overdue` flips lazily when plan detail (or now the orders list) is **read**, not via a background job.
- Admin panel screens exist ahead of every admin endpoint being wired up; keep shipping demo admin **screens** with mocks as listed above.
- Auth is enforced: missing/invalid/expired token `401`; wrong customer `403`.
- Customer refresh token lives in `localStorage` (Epic 15) so sessions survive a closed tab. Any XSS can read it for up to 24 hours. An httpOnly cookie would need a backend change.
- Switching from mock to Hostinger drops mock-only gallery fields (`name`, `category`, specs, extra images). Keep mapping in services so missing fields degrade to barcode + placeholder, not a crash.
- `npm run dev:live` (see root `package.json`) points the SPA at the real sandbox base URL instead of `mock-server`. Use it to spot-check real responses against this file — it does **not** replace the mock for day-to-day feature work, since most admin screens still need mock-only fields.
