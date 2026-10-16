import { describe, expect, it } from 'vitest';
import { ensureCustomerToken } from '../../src/services/ensureCustomerToken.js';
import { getCustomerRefreshToken, getCustomerToken } from '../../src/services/session.js';

describe('ensureCustomerToken', () => {
  it('issues a dev session with access and refresh tokens', async () => {
    const token = await ensureCustomerToken();
    expect(token).toBeTruthy();
    expect(getCustomerToken()).toBe(token);
    expect(getCustomerRefreshToken()).toBeTruthy();
  });
});
