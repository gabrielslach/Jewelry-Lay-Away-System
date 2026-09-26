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

When Epic 10 lands, the top of home is a short carousel (hook → plan → stats) with jewelry photos, not one tall text stack.

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

## Out of scope for these stories (tracked elsewhere)

- Shopper picking a real bank account, uploading proof, or paying through a live gateway (`501` / manual path in [`tech-debt.md`](tech-debt.md)).
- Staff login screen (mock admin session).
- Inventory provider, markup math, and ledger UI.
