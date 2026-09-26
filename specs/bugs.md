# Bugs

UX issues found by exercising the running SPA (`npm run dev`, 2026-09-26). Product intent is in [`user-stories.md`](user-stories.md). These are **observed** gaps, not a backlog of new features.

Severity: **P1** blocks a core story; **P2** is confusing or incomplete; **P3** is polish.

---

## Shopper

### BUG-1 — Catalog photos look like one oversized gem
**P2** · US-2, US-3, US-4

Placeholder SVGs (`/placeholders/*.svg`) are 600×600 with a small gem in a 24-unit viewBox. Cards (`object-fit: cover` in a 190px media well) and the PDP main image (`min-height: 420px` on desktop) crop to a huge gold outline. Every piece looks the same; carousel thumbs are easy to miss under the main frame.

### BUG-2 — Home “View Details” is not a product photo
**P2** · US-3, US-5 · **partially addressed 2026-09-26**

Home `PieceDetail` now uses `images[0]` when present (CDN). Re-check after a hard refresh if an old session still shows `GemMark`.

### BUG-3 — Home reserve actions sit below the fold
**P1** · US-5

On a phone-sized viewport the piece modal clips **Lay-Away Available** copy and the **Reserve This Piece** footer. The close (×) control stays visible; the primary action does not.

### BUG-4 — Checkout schedule is taller than the dialog
**P1** · US-7

Step 1 (6 payment dates) lives in a modal with `max-height: 88vh` and the whole dialog scrolling. **Payment 6** and **Continue** start off-screen. The title can scroll away with the body, so it is not obvious there is a next step.

The admin order modal has the same clip (installment 6 + **Mark Next Payment Received**) — US-22 / US-23.

### BUG-5 — Guest continue does not look like a sign-in wall
**P1** · US-6

With no customer token, `createLayawayPlan` throws `Please sign in to continue.` and does not POST. In the checkout dialog that `role="alert"` sits above a long date list (see BUG-4), so a guest can tap **Continue**, see no next step, and not notice the message. Do not treat extra Sample Client plans (`LA-1006` / `LA-1007`) as a guest write unless it reproduces with an empty session.

### BUG-6 — Collection cards are not the hit target
**P2** · US-2

Copy says “Choose a card to see photos.” Only **View Details** is a link; the image and title do nothing.

### BUG-7 — Section nav from Collections stays on Collections
**P2** · US-1

Header **How Lay-Away Works** / **Reviews** / **Contact** are `<a href="/#how">` (etc.). From `/collections`, a click on **How Lay-Away Works** left the address bar on `http://localhost:5173/collections` (no hash, still the catalog). Direct load of `http://localhost:5173/#how` did render home and scroll to the section.

### BUG-8 — Hash targets hide under the sticky nav
**P3** · US-1

On `/#how`, the “How It Works” eyebrow sits under the sticky header.

### BUG-9 — Phone header crushes brand and CTAs
**P1** · US-1, US-5

Below 681px, logo, **My Account**, **Start a Lay-Away**, and the hamburger all stay in one row. The logo truncates to “Sample” and the primary button to “Start”.

### BUG-10 — Pending installments look overdue
**P3** · US-12

Account (and admin order detail) use `badge-warn` for both **Pending** and **Overdue**. Unpaid-but-on-time rows read as a problem.

### BUG-11 — Seeded completed plan missing on My Account
**P2** · US-12

Sample Client seed includes completed **Vintage Rose Pendant** (`LA-0987`). After sign-in (and extra active plans in a dirty mock store) the Completed heading had no row and no empty-state copy in the accessibility tree. Account unit tests still expect that row — re-check on a fresh `npm run dev` before changing list filters.

### BUG-12 — Login does not say which password to use
**P3** · US-11

Email is prefilled (`client@sampleemail.com`). Password is also prefilled in React state (`password`) but the field is `type="password"`, so a first-time demo user has no visible hint.

### BUG-13 — Success toast competes with the confirmation modal
**P3** · US-9

Reservation success is both a modal (**Reservation Submitted**) and a toast (`z-index` 1200, `bottom: 80px`). The toast did not read as a separate confirmation while the dialog was still open.

---

## Staff

### BUG-14 — Dashboard collections chart is blank
**P2** · US-20

`collections_last_6_weeks` is `[62, 80, 55, 90, 74, 96]`, but the “Collections — Last 6 Weeks” panel shows an empty white box. `.bar-chart` uses `align-items: flex-end` so `.bar` height collapses; inner `height: var(--h)` percent has no definite parent height.

### BUG-15 — Recent activity runs title into detail
**P3** · US-20

Rows render as `New reservation — Solitaire Halo RingSample Client` (title and detail on one line with no space or break).

### BUG-16 — Phone admin menu dims the page without a usable drawer
**P1** · US-26

At ~390px width, **Open menu** shows the backdrop but the dark sidebar does not appear over the dashboard. Staff cannot reach Orders, Customers, or Settings without a wide window.

### BUG-17 — Settings switches have no accessible name
**P3** · US-25

The three policy toggles are `role="switch"` with no `aria-label` / labelled-by. Screen readers announce only “switch”.

---

## Notes (not filed as bugs)

- **Start a Lay-Away** goes to `/collections` (catalog first). Fits US-2 / US-5 if cards are easier to open (see BUG-6).
- Admin has no staff login screen (called out in user stories as out of scope).
- FAQ / About / Contact footer links all go to `/#contact`.
- Signed-in checkout (term → GCash → Continue → **Reservation Submitted**) works.
- Admin orders table, filters, customer directory, and settings form load on desktop.
