import { describe, expect, it } from 'vitest';
import { loginAdmin } from '../../src/services/loginAdmin.js';
import {
  clearAdminSession,
  getAdmin,
  getAdminRefreshToken,
  getAdminToken,
} from '../../src/services/session.js';

describe('loginAdmin', () => {
  it('stores access_token readable by getAdminToken', async () => {
    clearAdminSession();
    const data = await loginAdmin({
      email: 'admin@samplejewelry.example',
      password: 'password',
    });
    expect(data).toMatchObject({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
      admin: expect.objectContaining({ email: 'admin@samplejewelry.example' }),
    });
    expect(getAdminToken()).toBe(data.access_token);
    expect(getAdminRefreshToken()).toBe(data.refresh_token);
    expect(getAdmin()).toEqual(data.admin);
  });
});
