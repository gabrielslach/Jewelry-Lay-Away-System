# Tech debt — demo vs API

Inventory of what we **mock** to match [`demo.html`](demo.html), live APIs that have **no demo screen**, and **contract caveats**. Update this file when a mock is replaced with a real call or a new gap appears.

Source of truth for UI: the demo (plus Epic 5 / 8 / 9 screens the demo never had). Source of truth for real backend behavior: [`api-definition.md`](api-definition.md). Local HTTP doubles and invented demo-gap routes are **Epic 4** in [`epics.md`](epics.md) (`specs/mock-api.md` once that epic lands).

---

## Mocked to match the demo (or new storefront pages)

These screens or fields exist in the HTML demo or in later epics, but the published storefront/admin contract cannot fully back them today.

| Area | What we show | Why it is mocked | Related features |
| --- | --- | --- | --- |
| Gallery cards | Jewelry **name** + **category** badge | `GET /api/gallery` `title` is the barcode/PJ number, not a unique style name. There is **no `category`**. Client data for category/colour/quality/stone/metal is placeholder. | SF-3, SF-6, CL-1, PD-2 |
| Piece specs | Material, stone, size, certification | Not in the gallery field set. | SF-6, PD-2 |
| Price display | `₱` and “as low as ₱…/payment” | `currency` is mixed (`PHP` / `USD`). Markup is unresolved; `price` is raw provider `selling_price`. | SF-3, SF-6, SF-7, CL-1, PD-2 |
| Checkout terms | 1 / 2 / 3 months as 2 / 4 / 6 payments | API is `term_months` (max 3) + `installment_dates[]`. | SF-7 |
| Checkout create plan | Reserve without login (until Epic 5) | `POST /api/layaway/plans` **requires** customer JWT. Demo has no auth. | SF-7, AU-3 |
| Pay: GCash / card | Radio options in checkout step 2 | `POST /api/layaway/plans/:id/payments` returns **501** (gateway blocked). Mock-gateway reserves only. | SF-8 |
| Pay: bank transfer | Same step, no QR / proof upload in demo | Live: `GET /api/bank-accounts`, `POST .../payments/manual` (multipart proof). Demo UI does not include that flow yet. | SF-8 |
| Member since / phone | Account + customer detail | Not in the published API shapes. | AC-1, AD-6, AD-7 |
| Active vs overdue badges on lists | On Track / Overdue on account and admin tables | `overdue` is documented on **plan detail** (lazy on read). List payloads need mock-only fields. | AC-2, AD-4 |
| Completed lay-aways | Separate completed list | Confirm whether `GET /api/customers/:id/orders` includes completed plans; mock until proven. | AC-3 |
| Admin search + bell | Topbar chrome | No search or notifications API. | AD-1 |
| Dashboard “collected this month” | KPI `₱184,200` | No dedicated live metric; invented `GET /api/admin/dashboard`. | AD-2 |
| Dashboard chart + activity | Last 6 weeks bars, recent activity | Static in the demo; invented dashboard payload. | AD-3 |
| Customers directory | Table + detail | **No** live `GET /api/admin/customers`. Invented in Epic 4. | AD-6, AD-7 |
| Mark next payment received | One admin button on the order modal | Live path is pending-payment **confirm/reject** (and proof image). Invented `mark-next-paid`. | AD-5 |
| Settings form | Business name, max term, ₱50/day penalty, SMS / release / custom dates toggles | No matching live settings resource. Invented `GET`/`PUT /api/admin/settings`. | AD-8 |
| Collections pagination | Full catalog with page controls | Live `GET /api/gallery` **is** paginated (`count` / `next` / `previous`). Mock must seed ≥24 items (`page_size` 12) so two pages exist. In-memory `src/data/gallery.js` currently has six items and `next: null`. | CL-1, MS-2, MS-6 |
| Piece image carousel | Several photos, thumbs / swipe | Contract allows `images[]`, but sandbox items often have one URL or none. Mock seeds 2–4 placeholder images per piece. Empty list → gem placeholder. Do not invent extra live images. | PD-1, MS-2 |
| Catalog display extras beyond first six | Names, categories, specs for extra mock SKUs | Only the demo’s six pieces have canonical copy. Extra mock rows may reuse or invent display fields; they stay mock-only. | CL-1, PD-2 |

---

## Live API with no demo UI

These endpoints are in the contract (many already live) but **do not appear** as screens in `demo.html`. Login/register **do** have an SPA epic now (Epic 5) — still no demo mockup, so copy is ours.

| Endpoint | Purpose | SPA epic |
| --- | --- | --- |
| `POST /api/customers/register` | Customer registration | AU-1 |
| `POST /api/customers/login` | Customer JWT (`token` + `customer`) | AU-2 |
| Rate limit `429` on register/login | Distinct UI (“please wait”) vs wrong password | AU-1, AU-2 |
| `POST /api/admin/login` | Separate admin token | none (dev session helper) |
| `GET /api/bank-accounts` (public) | Bank name, account, QR for manual pay | not in demo checkout |
| `POST /api/layaway/plans/:id/payments/manual` | Proof-of-payment upload; status `submitted` until admin confirms | not in demo checkout |
| `GET /api/finance/ledger` | Finance/accounting ledger | none |
| `POST`/`GET /api/admin/markup-rules` | Markup rules (values still pending WBS M1) | none |
| `POST`/`GET /api/admin/penalty-rules` | Penalty rules | none |
| `POST /api/bank-accounts` | Admin create bank account + QR image | none |
| `GET /api/admin/payments/pending` | Manual submissions awaiting confirmation | none |
| `GET /api/admin/payments/:id/proof` | Proof image | none |
| `POST /api/admin/payments/:id/confirm` | Confirm → installment paid, ledger, maybe complete plan | none |
| `POST /api/admin/payments/:id/reject` | Reject with optional `reason` | none |

`GET /api/admin/plans` **does** map to the admin orders table (AD-4). `GET /api/gallery` pagination maps to Epic 8.

---

## Contract caveats (do not “fix” in the frontend)

- Frontend never calls the inventory provider; no API key in the browser.
- Gallery: no `category` query param or field — not a frontend gap to invent a real filter.
- `currency` inconsistency is a client data issue (WBS M1).
- Plan create may return `note` when no markup rule is configured — `total_price` may still be unmarked-up.
- Installment `overdue` flips lazily when plan detail is **read**, not via a background job.
- Admin is Phase 2 in the API doc; we still ship demo admin **screens** with mocks as listed above.
- Auth is enforced: missing/invalid token `401`; wrong customer `403`.
- Switching from mock to Hostinger drops mock-only gallery fields (`name`, `category`, specs, extra images). Keep mapping in services so missing fields degrade to barcode + placeholder, not a crash.
