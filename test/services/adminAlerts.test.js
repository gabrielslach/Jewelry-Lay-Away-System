import { describe, expect, it } from 'vitest';
import {
  getAdminAlerts,
  getAdminNotifications,
  markAdminNotificationsRead,
} from '../../src/services/adminAlerts.js';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';

describe('adminAlerts', () => {
  it('loads alert counts and notification list for staff', async () => {
    await ensureAdminToken();
    const alerts = await getAdminAlerts();
    expect(alerts).toMatchObject({
      pending_payments: expect.any(Number),
      due_today: expect.any(Number),
      overdue: expect.any(Number),
      unread_notifications: expect.any(Number),
    });
    const notes = await getAdminNotifications();
    expect(notes).toHaveProperty('items');
    await markAdminNotificationsRead();
    const after = await getAdminNotifications();
    expect(after.unread).toBe(0);
  });
});
