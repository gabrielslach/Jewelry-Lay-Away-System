import { describe, expect, it } from 'vitest';
import { deleteAdminCustomerSessions } from '../../src/services/deleteAdminCustomerSessions.js';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';

describe('deleteAdminCustomerSessions', () => {
  it('deletes a customer sessions', async () => {
    await ensureAdminToken();
    await expect(deleteAdminCustomerSessions(1)).resolves.toBeDefined();
  });

  it('rejects for an unknown customer', async () => {
    await ensureAdminToken();
    await expect(deleteAdminCustomerSessions(9999)).rejects.toThrow();
  });
});
