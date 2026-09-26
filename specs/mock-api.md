# Mock API (dev only)

Invented and mock-only fields used by the Vite mock in `mock-server/`. Live Hostinger responses will not include these.

## Mock-only gallery fields

On `GET /api/gallery` and `GET /api/gallery/:id` objects:

`name`, `category`, `material`, `stone`, `size`, `cert`

## Invented routes

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/dev/session/customer` | none |
| POST | `/api/dev/session/admin` | none |
| POST | `/api/layaway/plans/:id/payments/mock-gateway` | customer |
| GET | `/api/admin/dashboard` | admin |
| GET | `/api/admin/customers` | admin |
| GET | `/api/admin/customers/:id` | admin |
| POST | `/api/admin/plans/:id/mark-next-paid` | admin |
| GET | `/api/admin/settings` | admin |
| PUT | `/api/admin/settings` | admin |

Customer tokens: `Authorization: Bearer <token>` from login, register, or dev session.

Seeded customer login: `client@sampleemail.com` / `password`.

Seeded admin login: `admin@samplejewelry.example` / `password`.
