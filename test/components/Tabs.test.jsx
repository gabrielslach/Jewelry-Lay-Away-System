import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Tabs from '../../src/components/Tabs.jsx';

const TABS = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
];

describe('Tabs', () => {
  it('marks the active tab and reports clicks', () => {
    const onChange = vi.fn();
    render(
      <Tabs label="Sections" tabs={TABS} active="a" onChange={onChange} />,
    );
    expect(
      screen.getByRole('tablist', { name: 'Sections' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
