import { afterEach, describe, expect, it, vi } from 'vitest';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import { putAdminSettings } from '../../src/services/putAdminSettings.js';
import { getAdminSettings } from '../../src/services/getAdminSettings.js';

describe('putAdminSettings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes settings', async () => {
    await ensureAdminToken();
    const current = await getAdminSettings();
    const saved = await putAdminSettings({ ...current, max_term_months: 6 });
    expect(saved.max_term_months).toBe(6);
  });

  it('never sends retired settings keys', async () => {
    await ensureAdminToken();
    const real = fetch;
    let sent;
    vi.stubGlobal('fetch', (url, init) => {
      sent = JSON.parse(init.body);
      return real(url, init);
    });
    await putAdminSettings({
      max_term_months: 6,
      business_name: 'Gem Co',
      require_full_payment_before_release: true,
      sms_reminders: true,
      customer_selected_due_dates: false,
      penalty_per_day: 5,
    });
    expect(sent).toEqual({ max_term_months: 6 });
  });
});
