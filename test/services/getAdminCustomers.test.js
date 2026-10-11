import { describe, expect, it } from 'vitest';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import { getAdminCustomers } from '../../src/services/getAdminCustomers.js';

describe('admin customers', () => {
  it('lists Sample Shopper with phone', async () => {
    await ensureAdminToken();
    const rows = await getAdminCustomers();
    const shopper = rows.find((row) => row.name === 'Sample Shopper');
    expect(shopper.phone).toMatch(/^\+63/);
  });
});
