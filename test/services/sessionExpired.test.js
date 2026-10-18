import { describe, expect, it, vi } from 'vitest';
import { emitSessionExpired, subscribeSessionExpired } from '../../src/services/sessionExpired.js';

describe('sessionExpired', () => {
  it('notifies only subscribers of the emitted scope', () => {
    const customer = vi.fn();
    const admin = vi.fn();
    const offCustomer = subscribeSessionExpired('customer', customer);
    const offAdmin = subscribeSessionExpired('admin', admin);
    emitSessionExpired('customer');
    expect(customer).toHaveBeenCalledTimes(1);
    expect(admin).not.toHaveBeenCalled();
    offCustomer();
    offAdmin();
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    subscribeSessionExpired('admin', listener)();
    emitSessionExpired('admin');
    expect(listener).not.toHaveBeenCalled();
  });
});
