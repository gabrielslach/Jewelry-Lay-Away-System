import { describe, expect, it } from 'vitest';
import { formatPeso, splitAmount } from './money.js';

describe('formatPeso', () => {
  it('formats a peso amount with a grouping separator', () => {
    expect(formatPeso(48500)).toBe('₱48,500');
  });

  it('puts remainder pesos on the last installment', () => {
    const parts = splitAmount(48500, 6);
    expect(parts).toEqual([8083, 8083, 8083, 8083, 8083, 8085]);
    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(48500);
  });
});
