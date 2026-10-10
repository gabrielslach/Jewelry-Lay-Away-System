import { describe, expect, it } from 'vitest';
import { changeAdminPassword } from '../../src/services/adminPassword.js';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';

describe('adminPassword', () => {
  it('changes the signed-in staff password', async () => {
    await ensureAdminToken();
    const result = await changeAdminPassword({
      currentPassword: 'password',
      newPassword: 'adminpass',
    });
    expect(result.ok).toBe(true);
  });
});
