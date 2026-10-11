import { describe, expect, it } from 'vitest';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import { putAdminSettings } from '../../src/services/putAdminSettings.js';
import { getAdminSettings } from '../../src/services/getAdminSettings.js';

describe('putAdminSettings', () => {
  it('writes settings', async () => {
    await ensureAdminToken();
    const current = await getAdminSettings();
    const saved = await putAdminSettings({ ...current, sms_reminders: false });
    expect(saved.sms_reminders).toBe(false);
  });
});
