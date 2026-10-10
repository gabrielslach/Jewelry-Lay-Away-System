# User stories

How customers shop on Sample Jewelry Co. lay-away, and how staff use admin. Visual target remains [`demo.html`](demo.html). These stories describe **product intent**; open UX gaps vs the current SPA are in [`bugs.md`](bugs.md).

**Actors**
- **Shopper** — public visitor or signed-in customer.
- **Staff** — store employee on `/admin` (no staff login screen yet; the mock issues an admin session).

IDs skip US-15–US-19 so shopper and staff stay in separate ranges. Build sequence and API notes stay in [`epics.md`](epics.md).

---

## Shopper — discover and browse

### US-1 Browse the storefront
As a shopper, I want to land on the home page and see the brand, how lay-away works, and a sample of pieces, so I know I can reserve jewelry without paying in full today.

When Epic 11 lands, the top of home is a single split hero (copy + still-life), not a carousel.

### US-2 Open the full catalog
As a shopper, I want to open Collections and page through every piece, so I can find something beyond the home teaser.

### US-3 Inspect a piece
As a shopper, I want to open a piece and see photos, name, category, price, specs, and that lay-away is available, so I can decide whether to reserve it.

### US-4 Switch product photos
As a shopper, I want to move through a photo carousel (thumbs or swipe), so I can judge the piece from more than one angle.

---

## Shopper — reserve on lay-away

### US-5 Start a reservation
As a shopper, I want a clear Reserve action from the piece (home modal or `/collections/:id`), so I can begin a lay-away without calling the store.

### US-6 Sign in before I am charged a plan
As a shopper, I want to sign in or register if I am not already, so the plan is tied to my account and I can see it later.

### US-7 Choose term and dates
As a shopper, I want to pick 1 / 2 / 3 months (2 / 4 / 6 payments) and a date for each installment, so the schedule matches my cash flow.

### US-8 Choose how I will pay
As a shopper, I want to choose GCash / e-wallet, bank transfer, or card, so I can use the method I already have.

### US-9 Get confirmation
As a shopper, I want a success message and a toast that the reservation was submitted, so I know the store will hold the piece and follow up.

---

## Shopper — account

### US-10 Create an account
As a new shopper, I want to register with name, email, and password, so I can save plans across visits.

### US-11 Sign in later
As a returning shopper, I want to sign in with email and password, so I can see my plans. If I try too many times, I want a “wait a few minutes” message, not “wrong password.”

### US-12 See my lay-aways
As a signed-in shopper, I want My Account to show who I am, how many active plans I have, member since, each active plan’s schedule and On Track / Overdue, and completed plans, so I know what I still owe.

### US-13 Empty account
As a shopper with no plans, I want empty-state copy for active and completed lists, so the page does not look broken.

### US-14 Sign out
As a signed-in shopper, I want to sign out, so the next person on this device does not see my orders.

---

## Shopper — payments and security

### US-15 Pay my down payment by bank transfer
As a shopper, I want to see the store's bank accounts (with QR) and submit my bank reference, amount, and date paid for my down payment, so my piece gets held once accounting confirms it.

### US-16 Pay an installment by bank transfer
As a shopper, I want to submit the same bank-transfer details for any pending, due, or overdue installment, so I can keep my plan on track without a gateway.

### US-17 See my payment status and fix a rejection
As a shopper, I want each payment I submit to show Awaiting confirmation until accounting acts on it, and to see the reason if it's rejected so I can correct and resubmit.

### US-18 See my notifications
As a shopper, I want a notification bell with receipts, due-today reminders, and plan reconstructed/closed notices, so I don't have to rely on email alone to know what's happening with my plan.

### US-19 Manage my password
As a shopper, I want to reset a forgotten password from a link, and change my password from My Account, so I can keep my account secure.

---

## Staff — admin

### US-20 Open the desk
As staff, I want a dashboard with active lay-aways, collected this month, overdue payments, and active customers, plus a recent-activity list and a simple collections chart, so I can see the store’s health at a glance.

### US-21 Work the orders list
As staff, I want a table of all active plans I can filter All / On Track / Overdue, so I can chase late payments first.

### US-22 Open an order
As staff, I want order detail (customer, item, plan, status, installment rows) so I can answer “what’s left on this piece?”

### US-23 Record a shop payment
As staff, I want to mark the next installment received when the customer paid in person or we confirmed a transfer, so the plan moves On Track without a separate finance tool.

### US-24 Look up a customer
As staff, I want a customer directory (name, email, active plans, member since) and a detail view with mobile, so I can call someone about an overdue payment.

### US-25 Adjust store rules
As staff, I want to edit business name, max term, late penalty, and toggles (pay in full before release, SMS reminders, customer-picked dates) and save, so floor policy matches what the shopper sees.

### US-26 Use admin on a phone
As staff on the floor, I want the admin sidebar as an overlay on a small screen, so I can mark a payment received from a phone.

---

## Staff — payment operations and held pieces

### US-27 Review and decide a submitted payment
As receivables staff (or an admin), I want a pending-payments queue showing the proof and the expected vs. submitted amount side by side, so I can confirm or reject with a reason in one place.

### US-28 Chase due and overdue payments
As staff, I want a due-today and overdue list that flags installments already awaiting confirmation, so I don't call a customer who already paid.

### US-29 Get alerted to things needing attention
As staff, I want a badge and notification bell for pending payments, due/overdue counts, and reservation problems, so I notice them without hunting through every screen.

### US-30 Manage a held piece
As an admin, I want to retry a failed reservation hold and, when a plan ends, cancel the hold with a reason and handoff confirmation, so inventory stays accurate.

### US-31 Loop accounting into alerts
As an admin, I want a settings switch that also sends alerts to the accounting accounts, so receivables/ledger/reporting staff see the same alerts admins do.

### US-32 Change my own password
As staff, I want to change my password from the admin panel, so I don't need an admin to reset it for me.

---

## Out of scope for these stories (tracked elsewhere)

- Paying through a live gateway (still `501` — bank transfer is the only method, US-15/US-16).
- Staff login screen (mock admin session).
- Inventory provider, markup math, and ledger UI.
