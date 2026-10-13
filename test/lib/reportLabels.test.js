import { describe, expect, it } from 'vitest';
import {
  agingLabel,
  amountOf,
  humanizeKey,
} from '../../src/lib/reportLabels.js';

describe('reportLabels', () => {
  it('humanizes aging bucket keys and falls back to the raw key', () => {
    expect(agingLabel('days_1_30')).toBe('1-30 days');
    expect(agingLabel('days_31_plus')).toBe('31+ days');
    expect(agingLabel('weird')).toBe('weird');
  });

  it('humanizes snake_case keys', () => {
    expect(humanizeKey('scheduled_remaining')).toBe('Scheduled remaining');
  });

  it('reads the amount of a bucket object or a bare number', () => {
    expect(amountOf({ count: 1, amount: 50 })).toBe(50);
    expect(amountOf(75)).toBe(75);
  });
});
