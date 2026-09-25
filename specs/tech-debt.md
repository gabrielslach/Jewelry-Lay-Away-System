# Tech debt — demo vs API

Inventory of what we **mock** to match [`demo.html`](demo.html), live APIs that have **no demo screen**, and **contract caveats**. Update this file when a mock is replaced with a real call or a new gap appears.

Source of truth for UI: the demo. Source of truth for real backend behavior: [`api-definition.md`](api-definition.md).

---

## Mocked to match the demo

These screens or fields exist in the HTML demo (or we keep them so the SPA looks like the demo) but the storefront/admin contract cannot fully back them today.

| Area | What the demo shows | Why it is mocked | Related features |
| --- | --- | --- | --- |
| Gallery cards | Jewelry **name** + **category** badge | `GET /api/gallery` `title` is the barcode/PJ number, not a unique style name. There is **no `category`**. Client data for category/colour/quality/stone/metal is placeholder. | SF-3, SF-6 |
| Piece specs | Material, stone, size, certification | Not in the gallery field set. | SF-6 |
| Price display | `₱` and “as low as ₱…/payment” | `currency` is mixed (`PHP` / `USD`). Markup is unresolved; `price` is raw provider `selling_price`. | SF-3, SF-6, SF-7 |
| Checkout terms | 1 / 2 / 3 months as 2 / 4 / 6 payments | API is `term_months` (max 3) + `installment_dates[]`. | SF-7 |
| Checkout create plan | Reserve without login | `POST /api/layaway/plans` **requires** customer JWT. Demo has no auth. | SF-7, AC-1 |
| Pay: GCash / card | Radio options in checkout step 2 | `POST /api/layaway/plans/:id/payments` returns **501** (gateway blocked). | SF-8 |
| Pay: bank transfer | Same step, no QR / proof upload in demo | Live: `GET /api/bank-accounts`, `POST .../payments/manual` (multipart proof). Demo UI does not include that flow yet. | SF-8 |
| My Account session | Always “Sample Client” | No login/register screens in the demo. Live: `POST /api/customers/register`, `POST /api/customers/login`. | AC-1 |
| Member since / phone | Account + customer detail | Not in the published API shapes. | AC-1, AD-6, AD-7 |
| Active vs overdue badges on lists | On Track / Overdue on account and admin tables | `overdue` is documented on **plan detail** (lazy on read). List payloads may need extra mapping or mocks. | AC-2, AD-4 |
| Completed lay-aways | Separate completed list | Confirm whether `GET /api/customers/:id/orders` includes completed plans; mock until proven. | AC-3 |
| Admin search + bell | Topbar chrome | No search or notifications API. | AD-1 |
| Dashboard “collected this month” | KPI `₱184,200` | No dedicated metric; ledger exists but is not this widget. | AD-2 |
| Dashboard chart + activity | Last 6 weeks bars, recent activity | Static in the demo; no matching endpoints. | AD-3 |
| Customers directory | Table + detail modal | **No** `GET /api/admin/customers`. May derive unique people from `GET /api/admin/plans` or keep demo fixtures. | AD-6, AD-7 |
| Mark next payment received | One admin button on the order modal | Live path is pending-payment **confirm/reject** (and proof image), not “mark next installment”. | AD-5 |
| Settings form | Business name, max term, ₱50/day penalty, SMS / release / custom dates toggles | No matching settings resource. Penalty/markup APIs are generic JSON, not this form. Persistence is local/mock. | AD-8 |

---

## Live API with no demo UI

These endpoints are in the contract (many already live) but **do not appear** as screens or fields in `demo.html`. Do not build them until we add a feature; do not pretend the demo already covers them.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/customers/register` | Customer registration |
| `POST /api/customers/login` | Customer JWT (`token` + `customer`) |
| `POST /api/admin/login` | Separate admin token |
| Rate limit `429` on register/login | Distinct UI (“please wait”) vs wrong password |
| `GET /api/bank-accounts` (public) | Bank name, account, QR for manual pay |
| `POST /api/layaway/plans/:id/payments/manual` | Proof-of-payment upload; status `submitted` until admin confirms |
| `GET /api/finance/ledger` | Finance/accounting ledger |
| `POST`/`GET /api/admin/markup-rules` | Markup rules (values still pending WBS M1) |
| `POST`/`GET /api/admin/penalty-rules` | Penalty rules |
| `POST /api/bank-accounts` | Admin create bank account + QR image |
| `GET /api/admin/payments/pending` | Manual submissions awaiting confirmation |
| `GET /api/admin/payments/:id/proof` | Proof image |
| `POST /api/admin/payments/:id/confirm` | Confirm → installment paid, ledger, maybe complete plan |
| `POST /api/admin/payments/:id/reject` | Reject with optional `reason` |

`GET /api/admin/plans` **does** map to the admin orders table (AD-4). The payment/ledger/rules/bank endpoints above do not map to a demo page.

---

## Contract caveats (do not “fix” in the frontend)

- Frontend never calls the inventory provider; no API key in the browser.
- Gallery: no `category` query param or field — not a frontend gap to invent a real filter.
- `currency` inconsistency is a client data issue (WBS M1).
- Plan create may return `note` when no markup rule is configured — `total_price` may still be unmarked-up.
- Installment `overdue` flips lazily when plan detail is **read**, not via a background job.
- Admin is Phase 2 in the API doc; we still ship demo admin **screens** with mocks as listed above.
- Auth is enforced: missing/invalid token `401`; wrong customer `403`.
