import { describe, expect, it } from 'vitest';
import {
  clearCustomerSession,
  getCustomerSession,
  setCustomerSession,
} from '../../src/services/session.js';

describe('session', () => {
  it('round-trips customer session JSON', () => {
    setCustomerSession({ token: 'abc', customer: { id: 1 } });
    expect(getCustomerSession().token).toBe('abc');
    clearCustomerSession();
    expect(getCustomerSession()).toBeNull();
  });
});
