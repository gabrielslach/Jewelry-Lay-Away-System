import { describe, expect, it } from 'vitest';
import {
  addDaysIso,
  formatDisplayDate,
  formatManilaDate,
  formatManilaDateTime,
  formatMonth,
  formatRelativeTime,
  todayIsoLocal,
} from '../../src/lib/dates.js';

describe('dates', () => {
  it('formats display dates and adds days without UTC drift', () => {
    expect(formatDisplayDate('2026-10-01')).toBe('Oct 1, 2026');
    expect(addDaysIso('2026-10-01', 7)).toBe('2026-10-08');
    expect(todayIsoLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formats relative times using the full timestamp', () => {
    const now = new Date();
    expect(formatRelativeTime(now.toISOString())).toBe('Just now');
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatRelativeTime(yesterday.toISOString())).toBe('Yesterday');
  });
});

describe('formatMonth', () => {
  it('formats YYYY-MM as a short month and year', () => {
    expect(formatMonth('2026-10')).toBe('Oct 2026');
  });

  it('returns unreadable input as is', () => {
    expect(formatMonth('soon')).toBe('soon');
  });

  it('formats UTC timestamps in Asia/Manila', () => {
    expect(formatManilaDate('2026-10-07T16:00:00.000Z')).toBe('Oct 8, 2026');
    expect(formatManilaDate('2026-10-07T15:59:00.000Z')).toBe('Oct 7, 2026');
    expect(
      formatManilaDateTime('2026-10-07T16:30:00.000Z').replace(/\s/g, ' '),
    ).toBe('Oct 8, 2026, 12:30 AM');
    expect(formatManilaDate('nope')).toBe('');
  });
});
