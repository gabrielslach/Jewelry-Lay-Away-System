import { describe, expect, it, vi } from 'vitest';
import {
  clearAdminSession,
  clearCustomerSession,
  getAdmin,
  getAdminRefreshToken,
  getAdminToken,
  getCustomer,
  getCustomerRefreshToken,
  getCustomerToken,
  setAdminSession,
  setCustomerSession,
  subscribeCustomerSession,
} from '../../src/services/session.js';

const envelope = { access_token: 'a1', refresh_token: 'r1', customer: { id: 1 } };
const adminEnvelope = { access_token: 'aa1', refresh_token: 'ar1', admin: { id: 1, role: 'admin' } };

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

  it('keeps admin refresh and profile in localStorage, access token in sessionStorage', () => {
    setAdminSession(adminEnvelope);
    expect(localStorage.getItem('adminRefreshToken')).toBe('ar1');
    expect(JSON.parse(localStorage.getItem('admin'))).toEqual({ id: 1, role: 'admin' });
    expect(sessionStorage.getItem('adminAccessToken')).toBe('aa1');
    expect(getAdmin()).toEqual({ id: 1, role: 'admin' });
    expect(getAdminToken()).toBe('aa1');
    expect(getAdminRefreshToken()).toBe('ar1');
  });

  it('clears all admin session keys', () => {
    setAdminSession(adminEnvelope);
    sessionStorage.setItem('adminSession', JSON.stringify({ token: 'legacy' }));
    clearAdminSession();
    expect(getAdmin()).toBeNull();
    expect(getAdminToken()).toBeNull();
    expect(getAdminRefreshToken()).toBeNull();
    expect(sessionStorage.getItem('adminSession')).toBeNull();
  });

  it('removes the legacy adminSession blob on load', async () => {
    sessionStorage.setItem('adminSession', JSON.stringify({ token: 'old', admin: { id: 1 } }));
    vi.resetModules();
    const fresh = await import('../../src/services/session.js');
    expect(sessionStorage.getItem('adminSession')).toBeNull();
    expect(fresh.getAdminToken()).toBeNull();
  });
});
