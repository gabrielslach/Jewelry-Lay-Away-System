import { describe, expect, it } from 'vitest';
import {
  createAdminBankAccount,
  getAdminBankAccounts,
  updateAdminBankAccount,
} from '../../src/services/adminBankAccounts.js';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import { signInAdmin } from '../helpers/adminAuth.js';

describe('admin bank account services', () => {
  it('lists, creates, edits and deactivates accounts', async () => {
    await ensureAdminToken();
    expect((await getAdminBankAccounts()).map((a) => a.bank_name)).toContain(
      'Sample Bank',
    );

    const created = await createAdminBankAccount({
      bank_name: 'New Bank',
      account_name: 'AlMar',
      account_number: '12-34',
      qrFile: new File(['x'], 'qr.png', { type: 'image/png' }),
    });
    expect(created).toMatchObject({ bank_name: 'New Bank', is_active: true });
    expect(created.qr_code_url).toBeTruthy();

    const cleared = await updateAdminBankAccount(created.id, {
      removeQr: true,
    });
    expect(cleared.qr_code_url).toBeNull();

    const off = await updateAdminBankAccount(created.id, { is_active: false });
    expect(off.is_active).toBe(false);
  });

  it('rejects an invalid account with per-field messages', async () => {
    await ensureAdminToken();
    await expect(
      createAdminBankAccount({
        bank_name: '',
        account_name: 'AlMar',
        account_number: '1',
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'Invalid bank account',
      fields: { bank_name: 'This field is required.' },
    });
  });

  it('refuses to deactivate the last active account', async () => {
    await ensureAdminToken();
    await updateAdminBankAccount(2, { is_active: false });
    await expect(
      updateAdminBankAccount(1, { is_active: false }),
    ).rejects.toMatchObject({
      status: 409,
      message: 'At least one bank account must stay active',
    });
  });

  it('lets accounting read but not write', async () => {
    await signInAdmin('accounting');
    expect(await getAdminBankAccounts()).toHaveLength(2);
    await expect(
      createAdminBankAccount({
        bank_name: 'X',
        account_name: 'Y',
        account_number: '1',
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      updateAdminBankAccount(1, { is_active: false }),
    ).rejects.toMatchObject({
      status: 403,
    });
  });
});
