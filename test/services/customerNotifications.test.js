import { describe, expect, it } from 'vitest';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import {
  getCustomerNotifications,
  markCustomerNotificationsRead,
} from '../../src/services/customerNotifications.js';
import { createLayawayPlan } from '../../src/services/createLayawayPlan.js';
import { getGallery } from '../../src/services/getGallery.js';

describe('customerNotifications', () => {
  it('lists plan_created notifications and marks them read', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const { results } = await getGallery({ pageSize: 1 });
    await createLayawayPlan({ productId: results[0].id, termMonths: 1 });
    const before = await getCustomerNotifications();
    expect(before.unread).toBeGreaterThan(0);
    expect(before.items.some((row) => row.kind === 'plan_created')).toBe(true);
    await markCustomerNotificationsRead();
    const after = await getCustomerNotifications();
    expect(after.unread).toBe(0);
  });
});
