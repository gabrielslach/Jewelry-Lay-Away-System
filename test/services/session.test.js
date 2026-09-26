import { describe, expect, it, vi } from 'vitest';
import {
  clearCustomerSession,
  getCustomer,
  getCustomerRefreshToken,
  getCustomerToken,
  setCustomerSession,
  subscribeCustomerSession,
} from '../../src/services/session.js';

const envelope = { access_token: 'a1', refresh_token: 'r1', customer: { id: 1 } };

describe('session', () => {
  it('keeps refresh token and customer in localStorage, access token in sessionStorage', () => {
    setCustomerSession(envelope);
    expect(localStorage.getItem('customerRefreshToken')).toBe('r1');
    expect(JSON.parse(localStorage.getItem('customer'))).toEqual({ id: 1 });
    expect(sessionStorage.getItem('customerAccessToken')).toBe('a1');
    expect(getCustomer()).toEqual({ id: 1 });
    expect(getCustomerToken()).toBe('a1');
    expect(getCustomerRefreshToken()).toBe('r1');
  });

  it('is signed in from localStorage alone', () => {
    setCustomerSession(envelope);
    sessionStorage.clear();
    expect(getCustomer()).toEqual({ id: 1 });
    expect(getCustomerToken()).toBeNull();
  });

  it('clears both storages and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeCustomerSession(listener);
    setCustomerSession(envelope);
    clearCustomerSession();
    unsubscribe();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(getCustomer()).toBeNull();
    expect(getCustomerToken()).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('ignores and removes the legacy single-token session on load', async () => {
    sessionStorage.setItem(
      'customerSession',
      JSON.stringify({ token: 'old', customer: { id: 1 } }),
    );
    vi.resetModules();
    const fresh = await import('../../src/services/session.js');
    expect(sessionStorage.getItem('customerSession')).toBeNull();
    expect(fresh.getCustomer()).toBeNull();
    expect(fresh.getCustomerToken()).toBeNull();
  });
});
