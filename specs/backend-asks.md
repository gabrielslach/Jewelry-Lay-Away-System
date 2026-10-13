# Backend asks from the stakeholder review

Frontend → backend. Items marked **Proposed** are the shapes the frontend will build against. Please confirm or correct them. Items marked **Confirm** need a yes/no that matches production.

## 1. Bank accounts CRUD (blocks the Bank accounts screen)

Today only `GET /api/bank-accounts` (public) and `POST /api/bank-accounts` (admin) are documented. Please cover the endpoints below. If some already exist, tell us and we'll adjust.

### Endpoints

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/bank-accounts` | Public | **Unchanged.** Active accounts only. |
| GET | `/api/admin/bank-accounts` | `admin`, `accounting` | All accounts, including inactive. Accounting can read because it picks the account when reviewing payments. |
| POST | `/api/admin/bank-accounts` | `admin` | Create. `multipart/form-data`. |
| PATCH | `/api/admin/bank-accounts/:id` | `admin` | Edit any field and toggle `is_active`. `multipart/form-data`. |

**Delete vs deactivate (Proposed):** there is no `DELETE`. An account is deactivated with `PATCH { is_active: false }`. Payments keep their `bank_account_id`, so history stays intact, and an account can be turned back on. If you prefer a hard delete for unused accounts, say so and send `409` when the account is referenced.

**QR upload (Proposed):** `qr_code` is a file field on the same `multipart/form-data` request as create and edit. There is no separate upload endpoint. On PATCH, omit `qr_code` to keep the current image. Send `remove_qr_code=true` to clear it. Accepted types: JPEG, PNG, WebP, max 5 MB (please confirm the limit).

The existing `POST /api/bank-accounts` can stay as an alias until the frontend has moved.

### Response shape (all endpoints)

```json
{
  "id": 3,
  "bank_name": "BDO",
  "account_name": "AlMar Corp",
  "account_number": "001234567890",
  "qr_code_url": "https://cdn.example.com/qr/3.webp",
  "is_active": true,
  "created_at": "2026-10-13T08:30:00.000Z"
}
```

- `qr_code_url` is `null` when no QR was uploaded.
- `is_active` and `created_at` are returned on the admin endpoints. The public list may keep returning only `{ id, bank_name, account_name, account_number, qr_code_url }`. Please say which you choose.

### Requests

**List (admin)**

```
GET /api/admin/bank-accounts
200 [ { ...BankAccount }, ... ]
```

**Create**

```
POST /api/admin/bank-accounts
Content-Type: multipart/form-data

bank_name       text, required, max 100
account_name    text, required, max 100
account_number  text, required, max 50, kept as a string (leading zeros)
qr_code         file, optional
is_active       boolean, optional, default true

201 { ...BankAccount }
```

**Edit / toggle**

```
PATCH /api/admin/bank-accounts/:id
Content-Type: multipart/form-data

Any of: bank_name, account_name, account_number, qr_code, remove_qr_code, is_active
(only the fields sent are changed)

200 { ...BankAccount }
```

### Errors (Proposed)

All errors are `{ "error": "<text>" }`. Validation errors also carry `fields`, so the form can mark the right inputs.

| Status | When | Body |
|---|---|---|
| `400` | Missing or invalid field | `{ "error": "Invalid bank account", "fields": { "bank_name": "Required", "account_number": "Required" } }` |
| `400` | QR is not an image or is too large | `{ "error": "Invalid bank account", "fields": { "qr_code": "Must be a JPEG, PNG or WebP image up to 5 MB" } }` |
| `401` | No token, or the account is deactivated | `{ "error": "<text>" }` |
| `403` | Caller is `accounting` on a write | `{ "error": "Admin access required" }` |
| `404` | Unknown `:id` | `{ "error": "Bank account not found" }` |
| `409` | Duplicate `bank_name` + `account_number` | `{ "error": "This bank account already exists" }` |
| `409` | Deactivating the last active account | `{ "error": "At least one bank account must stay active" }` (optional; tell us if you won't enforce this) |

### Permissions and audit

- Writes are `admin` only. `accounting` gets `403`.
- Every create, edit and activate/deactivate writes an audit-log entry with the old → new values, as settings changes do today.

### Payment rules

`bank_account_id` on `POST /api/layaway/plans/:id/payments/manual` and `.../down-payment/manual` is accepted only for an **active** account.

| Status | When | Body |
|---|---|---|
| `400` | `bank_account_id` does not exist | `{ "error": "Invalid bank account" }` |
| `409` | Account exists but is inactive | `{ "error": "Bank account is not active" }` |

A payment submitted before an account was deactivated keeps working and stays visible in the admin queue.

## 2. Staff

- **Session role refresh:** please add `GET /api/admin/me` returning `{ id, name, email, role, is_active }`. Alternatively, include the role in the refresh response. Without it, a role change by another admin shows stale permissions until the next login.
- **Error clarity:** please document the exact status and `error` text for each guardrail:
  - cap full
  - duplicate email
  - self-demotion or self-deactivation
  - last active admin
  - reactivating into a full role
- **List fields:** please confirm `GET /api/admin/staff` returns `id, name, email, role, is_active, created_at`.
- **Caps:** please confirm they count active accounts only. The UI assumes this.

## 3. Orders and installments (`/api/customers/orders`, `/api/admin/plans`)

- **Closed plans** (`cancelled`, `defaulted`, `completed`):
  - Return `next_due_date: null`, so the frontend doesn't have to guess.
  - Stop returning `overdue` as an installment status once a plan is closed.
- **Every installment** returns `payment_status` and `due_date`. The rejected-date fix depends on `due_date`.
- **Reservation:** `/api/admin/plans` always returns `reservation_status` (`none` included), never null or missing.
- **Customer counts:** `active_layaway_count` is present on both the customer list and the single-customer endpoint. The mock already matches.
- **Payment sequencing (nice to have):** a per-installment flag, for example `payable: false` plus `blocked_by` (the earlier installment id). The frontend then doesn't have to copy the "earlier installment first" rule.

## 4. Customer profile

Please confirm that `GET /api/customers/me` and the login and register responses return `created_at`. "Member since" depends on it.

## 5. Images

- Gallery list and detail both return `thumb_url`, `web_url` and `url` for every image.
- Please confirm `thumb_url` is the 480 px image and `web_url` the 1200 px WebP.
- Please confirm both sizes are cacheable on the CDN.

## 6. Confirm what's already in place

We built against these. Please confirm they match production:

- `401` and `403` on `GET /api/layaway/plans/:id`.
- The two `409` messages on manual payments: "Pay the earlier installment first" and "Plan is <status>".
- `/api/admin/dashboard` returning `active_layaways`, `overdue_payments` and `active_customers`.
- Retry and Cancel reservation returning `403` for accounting.

## Not backend

- The T&C, Privacy Policy and model photos are client placeholders.
- Designs come from the provider API.
