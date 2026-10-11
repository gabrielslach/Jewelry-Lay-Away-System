import { describe, expect, it } from 'vitest';
import { adminReturnPath, returnPath } from '../../src/lib/returnPath.js';

describe('returnPath', () => {
  it('keeps a same-site path with its query', () => {
    expect(returnPath('/collections/1?reserve=1')).toBe('/collections/1?reserve=1');
  });

  it('keeps encoded slashes on this site', () => {
    expect(returnPath('/%2F%2Fevil')).toBe('/%2F%2Fevil');
  });

  it('falls back to the account page for a missing from', () => {
    expect(returnPath(null)).toBe('/account');
  });

  it('uses a custom fallback when provided', () => {
    expect(returnPath(null, '/admin')).toBe('/admin');
  });

  it.each([
    '//evil.com',
    'https://evil.com',
    ' /evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    '//[',
    '/.//evil.com',
    '/..//evil.com',
    '/%2e//evil.com',
    '/./\\evil.com',
  ])('falls back to the account page for %j', (from) => {
    expect(returnPath(from)).toBe('/account');
  });
});

describe('adminReturnPath', () => {
  it('keeps admin destinations', () => {
    expect(adminReturnPath('/admin/orders')).toBe('/admin/orders');
  });

  it('falls back for storefront or login paths', () => {
    expect(adminReturnPath('/account')).toBe('/admin');
    expect(adminReturnPath('/admin/login')).toBe('/admin');
    expect(adminReturnPath(null)).toBe('/admin');
  });
});
