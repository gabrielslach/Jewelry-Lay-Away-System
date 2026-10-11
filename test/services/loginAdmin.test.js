import { describe, expect, it } from 'vitest';
import { loginAdmin } from '../../src/services/loginAdmin.js';
import { clearAdminSession, getAdminToken } from '../../src/services/session.js';

describe('loginAdmin', () => {
  it('stores the admin session token', async () => {
    clearAdminSession();
    await loginAdmin({
      email: 'admin@samplejewelry.example',
      password: 'password',
    });
    expect(getAdminToken()).toBeTruthy();
  });
});
