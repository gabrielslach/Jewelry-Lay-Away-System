import { describe, expect, it } from 'vitest';
import { createAdminStaff } from '../../src/services/createAdminStaff.js';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import { getAdminStaff } from '../../src/services/getAdminStaff.js';
import { updateAdminStaff } from '../../src/services/updateAdminStaff.js';

describe('admin staff services', () => {
  it('lists, creates and updates staff', async () => {
    await ensureAdminToken();
    expect((await getAdminStaff()).map((m) => m.name)).toContain('Sample Accountant');

    const created = await createAdminStaff({
      name: 'New Hire',
      email: 'hire@example.com',
      password: 'longenough',
      role: 'accounting',
    });
    expect(created).toMatchObject({ name: 'New Hire', role: 'accounting', is_active: true });

    const updated = await updateAdminStaff(created.id, { is_active: false });
    expect(updated.is_active).toBe(false);
  });

  it('rejects a duplicate email with the API message', async () => {
    await ensureAdminToken();
    await expect(
      createAdminStaff({
        name: 'Dup',
        email: 'accounting@samplejewelry.example',
        password: 'longenough',
        role: 'accounting',
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
});
