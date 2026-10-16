import { describe, expect, it } from 'vitest';
import { idNumber, sortByValue } from '../../src/lib/tableSort.js';

describe('sortByValue', () => {
  const compare = sortByValue((item) => item.v);
  const row = (v) => ({ original: { v } });

  it('orders by the underlying value', () => {
    expect(compare(row(2), row(10))).toBe(-1);
    expect(compare(row(10), row(2))).toBe(1);
    expect(compare(row(3), row(3))).toBe(0);
  });

  it('sorts missing values last', () => {
    expect(compare(row(null), row(1))).toBe(1);
    expect(compare(row(1), row(undefined))).toBe(-1);
  });

  it('compares ISO date strings chronologically', () => {
    const byDate = sortByValue((item) => item.v);
    expect(byDate(row('2026-09-15'), row('2026-10-01'))).toBe(-1);
  });
});

describe('idNumber', () => {
  it('extracts the numeric part of an id', () => {
    expect(idNumber('LA-10')).toBe(10);
    expect(idNumber(7)).toBe(7);
  });
});
