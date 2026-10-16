import { describe, expect, it } from 'vitest';
import { getBankAccounts } from '../../src/services/getBankAccounts.js';

describe('getBankAccounts', () => {
  it('loads public bank accounts for the payment form', async () => {
    const rows = await getBankAccounts();
    expect(rows[0]).toMatchObject({
      bank_name: 'Sample Bank',
      account_name: 'AlMar Corp',
      account_number: '0011-2233-4455',
    });
  });
});
