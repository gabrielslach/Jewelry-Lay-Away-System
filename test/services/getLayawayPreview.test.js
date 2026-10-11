import { describe, expect, it, vi } from 'vitest';
import {
  getLayawayPreview,
  lowestLongestTermPayment,
} from '../../src/services/getLayawayPreview.js';
import * as http from '../../src/services/http.js';

describe('getLayawayPreview', () => {
  it('requests preview with product_id and optional term_months', async () => {
    const request = vi.spyOn(http, 'request').mockResolvedValue({ product_id: 1, options: [] });
    await getLayawayPreview({ productId: 12, termMonths: 2 });
    expect(request).toHaveBeenCalledWith('/api/layaway/preview?product_id=12&term_months=2');
  });

  it('omits term_months when not provided', async () => {
    const request = vi.spyOn(http, 'request').mockResolvedValue({ product_id: 1, options: [] });
    await getLayawayPreview({ productId: 9 });
    expect(request).toHaveBeenCalledWith('/api/layaway/preview?product_id=9');
  });
});

describe('lowestLongestTermPayment', () => {
  it('returns the lowest installment on the max term option', () => {
    const amount = lowestLongestTermPayment({
      max_term_months: 3,
      options: [
        {
          term_months: 1,
          schedule: [{ amount: 100 }, { amount: 90 }],
        },
        {
          term_months: 3,
          schedule: [{ amount: 50 }, { amount: 40 }, { amount: 45 }],
        },
      ],
    });
    expect(amount).toBe(40);
  });

  it('returns null when schedule is missing', () => {
    expect(lowestLongestTermPayment({ max_term_months: 3, options: [] })).toBeNull();
    expect(
      lowestLongestTermPayment({
        max_term_months: 3,
        options: [{ term_months: 3, schedule: [] }],
      }),
    ).toBeNull();
  });
});
