import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ReservationBadge from '../../src/components/ReservationBadge.jsx';

describe('ReservationBadge', () => {
  it('renders a label for known statuses', () => {
    render(<ReservationBadge status="waiting_for_stock" />);
    expect(screen.getByText('Waiting for stock')).toHaveClass('badge-amber');
  });

  it('renders a muted None badge for none', () => {
    render(<ReservationBadge status="none" />);
    expect(screen.getByText('None')).toHaveClass('badge-mute');
  });

  it('renders nothing for unknown or missing statuses', () => {
    const { container } = render(<ReservationBadge status="bogus" />);
    expect(container).toBeEmptyDOMElement();
  });
});
