import { describe, expect, it } from 'vitest';
import { getAdminSettings } from '../../src/services/getAdminSettings.js';
import { putAdminSettings } from '../../src/services/putAdminSettings.js';

describe('admin settings', () => {
  it('reads and persists business settings', async () => {
    const current = await getAdminSettings();
    expect(current.business_name).toBe('Sample Jewelry Co.');
    const saved = await putAdminSettings({ ...current, max_term_months: 2 });
    expect(saved.max_term_months).toBe(2);
  });
});
