import { describe, expect, it } from 'vitest';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';

describe('ensureAdminToken', () => {
  it('issues an admin token', async () => {
    const token = await ensureAdminToken();
    expect(token).toBeTruthy();
  });
});
