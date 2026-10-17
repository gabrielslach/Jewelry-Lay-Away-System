# Tech debt

Code changes needed to match [`api-definition.md`](api-definition.md) **v1.32** (Oct 17). Rows are removed once done. Update this file when a row is done or a new gap appears.

| # | What changed | What we do today | Where |
| --- | --- | --- | --- |
| 5 | **Settings: partial update; only `max_term_months` and `notify_accounting_roles` do anything.** `penalty_per_day` is always `null`. | `Settings.jsx` already shows only those two. `putAdminSettings.js` `RETIRED_KEYS` lists the old invented names, not the real `send_sms_reminders` and `allow_customer_selected_due_dates`, and it still sends the whole form back. The mock merges any body keys. | AD-8 |
| 6 | **`POST /api/admin/plans/:id/reservation/cancel` ignores plan status** (only a completed reservation gets `409`). | Mock `reservation/cancel` route may check plan state differently. Verify before relying on it. | AD-4 |
