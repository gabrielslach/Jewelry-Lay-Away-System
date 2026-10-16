import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReportFilters from '../../src/components/ReportFilters.jsx';

describe('ReportFilters', () => {
  it('edits the dates and reports Apply and Clear', () => {
    const onChange = vi.fn();
    const onApply = vi.fn();
    const onClear = vi.fn();
    render(
      <ReportFilters
        values={{ from: '', to: '2026-10-31' }}
        onChange={onChange}
        onApply={onApply}
        onClear={onClear}
      >
        <span>extra</span>
      </ReportFilters>,
    );
    expect(screen.getByLabelText('To')).toHaveValue('2026-10-31');
    expect(screen.getByText('extra')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('From'), {
      target: { value: '2026-10-01' },
    });
    expect(onChange).toHaveBeenCalledWith({
      from: '2026-10-01',
      to: '2026-10-31',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onApply).toHaveBeenCalled();
    expect(onClear).toHaveBeenCalled();
  });
});
