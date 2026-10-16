import { describe, expect, it } from 'vitest';
import { formatPeso, formatPesoCompact, splitAmount } from '../../src/lib/money.js';

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

describe('formatPesoCompact', () => {
  it.each([
    [0, '₱0'],
    [950, '₱950'],
    [1000, '₱1k'],
    [1200, '₱1.2k'],
    [12500, '₱12.5k'],
    [1200000, '₱1.2M'],
  ])('formats %d as %s', (amount, expected) => {
    expect(formatPesoCompact(amount)).toBe(expected);
  });
});
