import { describe, expect, it } from 'vitest';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import { getAdminCustomer } from '../../src/services/getAdminCustomer.js';

describe('getAdminCustomer', () => {
  it('loads a customer by id', async () => {
    await ensureAdminToken();
    const detail = await getAdminCustomer(1);
    expect(detail.name).toBe('Sample Client');
  });
});
