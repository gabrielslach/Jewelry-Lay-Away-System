import { describe, expect, it } from 'vitest';
import { cancelLayawayPlan } from '../../src/services/cancelLayawayPlan.js';
import { createLayawayPlan } from '../../src/services/createLayawayPlan.js';
import { getGallery } from '../../src/services/getGallery.js';
import { loginCustomer } from '../../src/services/loginCustomer.js';

describe('cancelLayawayPlan', () => {
  it('cancels a plan whose down payment is still pending', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const { results } = await getGallery({ pageSize: 1 });
    const plan = await createLayawayPlan({ productId: results[0].id, termMonths: 1 });
    await expect(cancelLayawayPlan(plan.id)).resolves.toMatchObject({ status: 'cancelled' });
  });

  it('surfaces the 409 when the down payment is already confirmed', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    await expect(cancelLayawayPlan('LA-1001')).rejects.toMatchObject({ status: 409 });
  });
});
