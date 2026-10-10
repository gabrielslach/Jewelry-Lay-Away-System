import { describe, expect, it } from 'vitest';
import {
  addDaysIso,
  formatDisplayDate,
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
