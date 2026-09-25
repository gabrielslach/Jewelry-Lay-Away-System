import { describe, expect, it } from 'vitest';
import { formatPeso } from './money.js';

describe('formatPeso', () => {
  it('formats a peso amount with a grouping separator', () => {
    expect(formatPeso(48500)).toBe('₱48,500');
  });
});
