import { describe, expect, it } from 'vitest';
import { getAdminCustomer } from '../../src/services/getAdminCustomer.js';

describe('getAdminCustomer', () => {
  it('loads a customer by id', async () => {
    const detail = await getAdminCustomer(1);
    expect(detail.name).toBe('Sample Client');
  });
});
