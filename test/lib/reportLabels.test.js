import { describe, expect, it } from 'vitest';
import { amountOf, humanizeKey } from '../../src/lib/reportLabels.js';

describe('reportLabels', () => {
  it('humanizes snake_case keys', () => {
    expect(humanizeKey('scheduled_remaining')).toBe('Scheduled remaining');
  });

  it('reads the amount of a bucket object or a bare number', () => {
    expect(amountOf({ count: 1, amount: 50 })).toBe(50);
    expect(amountOf(75)).toBe(75);
  });
});
