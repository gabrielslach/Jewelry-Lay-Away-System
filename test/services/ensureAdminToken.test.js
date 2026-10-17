import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminRequest, ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import { loginAdmin } from '../../src/services/loginAdmin.js';
import {
  clearAdminSession,
  getAdminRefreshToken,
  getAdminToken,
  setAdminSession,
  setAdminToken,
} from '../../src/services/session.js';

const DASHBOARD = '/api/admin/dashboard';
let fetchSpy;

function callsTo(path) {
  return fetchSpy.mock.calls.filter(([url]) => url === path);
}

async function signIn() {
  await loginAdmin({
    email: 'admin@samplejewelry.example',
    password: 'password',
  });
  fetchSpy.mockClear();
}

describe('ensureAdminToken', () => {
  it('issues an admin token for test helpers', async () => {
    clearAdminSession();
    const token = await ensureAdminToken();
    expect(token).toBeTruthy();
    expect(getAdminToken()).toBe(token);
    expect(getAdminRefreshToken()).toBeTruthy();
  });
});

describe('adminRequest', () => {
  beforeEach(() => {
    fetchSpy = vi.fn(globalThis.fetch);
    vi.stubGlobal('fetch', fetchSpy);
  });

  it('rejects without minting when there is no admin token', async () => {
    clearAdminSession();
    await expect(adminRequest(DASHBOARD)).rejects.toMatchObject({
      name: 'ServiceError',
      status: 401,
      message: 'Please sign in to continue.',
    });
    expect(getAdminToken()).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('clears the admin session when refresh is rejected after a 401', async () => {
    setAdminSession({
      access_token: 'not-a-real-token',
      refresh_token: 'also-fake',
      admin: { id: 1, name: 'Staff' },
    });

    await expect(adminRequest(DASHBOARD)).rejects.toMatchObject({
      status: 401,
      message: 'Please sign in to continue.',
    });
    expect(getAdminToken()).toBeNull();
    expect(getAdminRefreshToken()).toBeNull();
  });

  it('uses the existing admin token when present', async () => {
    await ensureAdminToken();
    const data = await adminRequest(DASHBOARD);
    expect(data).toHaveProperty('active_layaways');
  });

  it('refreshes once and retries after a 401', async () => {
    await signIn();
    setAdminToken('expired');
    const data = await adminRequest(DASHBOARD);
    expect(data).toHaveProperty('active_layaways');
    expect(callsTo('/api/admin/refresh')).toHaveLength(1);
    expect(callsTo(DASHBOARD)).toHaveLength(2);
    expect(getAdminToken()).not.toBe('expired');
  });

  it('refreshes the access token from the stored refresh token when it is missing', async () => {
    await signIn();
    sessionStorage.clear();
    const data = await adminRequest(DASHBOARD);
    expect(data).toHaveProperty('active_layaways');
    expect(callsTo('/api/admin/refresh')).toHaveLength(1);
    expect(getAdminToken()).toBeTruthy();
  });
});
