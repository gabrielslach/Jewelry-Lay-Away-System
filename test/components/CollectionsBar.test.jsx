import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CollectionsBar from '../../src/components/CollectionsBar.jsx';

function renderBar(week, weekNumber = 3) {
  render(
    <div role="list">
      <CollectionsBar week={week} weekNumber={weekNumber} />
    </div>,
  );
  return screen.getByRole('listitem');
}

describe('CollectionsBar', () => {
  it('names the column with the week date and exact amount', () => {
    const column = renderBar({ week_start: '2026-09-20', total: 12500, height: 100 });

    expect(column).toHaveAccessibleName('Week of Sep 20: ₱12,500.00');
    expect(column.querySelector('.bar')).toHaveAttribute('title', 'Week of Sep 20: ₱12,500.00');
  });

  it('shows the compact total and week number, hidden from assistive tech', () => {
    const column = renderBar({ week_start: '2026-09-20', total: 12500, height: 100 });

    expect(screen.getByText('₱12.5k')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Wk 3')).toHaveAttribute('aria-hidden', 'true');
    expect(column.querySelector('.bar').style.height).toBe('100%');
  });

  it('renders a zero week as the 2px zero-state bar', () => {
    const column = renderBar({ week_start: '2026-09-13', total: 0, height: 0 });

    expect(screen.getByText('₱0')).toHaveClass('bar-label-zero');
    const bar = column.querySelector('.bar');
    expect(bar).toHaveClass('bar-zero');
    expect(bar.style.height).toBe('');
  });
});
