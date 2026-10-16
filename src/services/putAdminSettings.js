import { adminRequest } from './ensureAdminToken.js';

const RETIRED_KEYS = [
  'sms_reminders',
  'customer_selected_due_dates',
  'penalty_per_day',
  'business_name',
  'require_full_payment_before_release',
];

export function putAdminSettings(settings) {
  const body = Object.fromEntries(
    Object.entries(settings).filter(([key]) => !RETIRED_KEYS.includes(key)),
  );
  return adminRequest('/api/admin/settings', { method: 'PUT', body });
}
