import { describe, expect, it } from 'vitest';
import { getAdminCustomers } from '../../src/services/getAdminCustomers.js';
import { getAdminCustomer } from '../../src/services/getAdminCustomer.js';

describe('admin customers', () => {
  it('lists Sample Shopper and loads detail', async () => {
    const rows = await getAdminCustomers();
    const shopper = rows.find((row) => row.name === 'Sample Shopper');
    expect(shopper).toBeTruthy();
    const detail = await getAdminCustomer(shopper.id);
    expect(detail.phone).toMatch(/^\+63/);
  });
});
