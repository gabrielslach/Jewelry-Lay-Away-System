import { describe, expect, it } from 'vitest';
import { planStatusDisplay } from '../../src/lib/planStatuses.js';

describe('planStatusDisplay', () => {
  it('returns the label and class for a known status', () => {
    expect(planStatusDisplay('overdue')).toEqual({ label: 'Overdue', className: 'badge-warn' });
  });

  it('title-cases an unknown status and mutes its badge', () => {
    expect(planStatusDisplay('on_hold')).toEqual({ label: 'On Hold', className: 'badge-mute' });
  });
});
