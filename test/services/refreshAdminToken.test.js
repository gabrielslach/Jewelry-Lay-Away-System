import { describe, expect, it } from 'vitest';
import { loginAdmin } from '../../src/services/loginAdmin.js';
import { refreshAdminToken } from '../../src/services/refreshAdminToken.js';
import { getAdmin, getAdminToken } from '../../src/services/session.js';

describe('refreshAdminToken', () => {
  it('stores a new access token and keeps the refresh token', async () => {
    const { refresh_token } = await loginAdmin({
      email: 'admin@samplejewelry.example',
      password: 'password',
    });
    sessionStorage.clear();
    const accessToken = await refreshAdminToken();
    expect(getAdminToken()).toBe(accessToken);
    expect(localStorage.getItem('adminRefreshToken')).toBe(refresh_token);
  });

  it('clears the session when the refresh token is unknown', async () => {
    await loginAdmin({
      email: 'admin@samplejewelry.example',
      password: 'password',
    });
    localStorage.setItem('adminRefreshToken', 'unknown');
    await expect(refreshAdminToken()).rejects.toMatchObject({ status: 401 });
    expect(getAdmin()).toBeNull();
    expect(getAdminToken()).toBeNull();
  });
});
