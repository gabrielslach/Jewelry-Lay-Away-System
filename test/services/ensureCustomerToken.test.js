import { describe, expect, it } from 'vitest';
import { ensureCustomerToken } from '../../src/services/ensureCustomerToken.js';
import { getCustomerToken } from '../../src/services/session.js';

describe('ensureCustomerToken', () => {
  it('issues a dev session token', async () => {
    const token = await ensureCustomerToken();
    expect(token).toBeTruthy();
    expect(getCustomerToken()).toBe(token);
  });
});
