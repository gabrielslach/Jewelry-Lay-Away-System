import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProgressBar from '../../src/components/ProgressBar.jsx';

describe('ProgressBar', () => {
  it('exposes an accessible progressbar sized by value over max', () => {
    render(<ProgressBar value={250} max={1000} tone="warn" label="Paid 250 of 1000" />);
    const bar = screen.getByRole('progressbar', { name: 'Paid 250 of 1000' });
    expect(bar).toHaveAttribute('aria-valuenow', '250');
    expect(bar).toHaveAttribute('aria-valuemax', '1000');
    expect(bar.firstChild).toHaveStyle({ width: '25%' });
    expect(bar.firstChild).toHaveClass('progress-warn');
  });

  it('renders an empty bar when max is zero', () => {
    render(<ProgressBar value={0} max={0} label="none" />);
    expect(screen.getByRole('progressbar').firstChild).toHaveStyle({ width: '0%' });
  });
});
