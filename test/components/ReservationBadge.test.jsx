import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ReservationBadge from '../../src/components/ReservationBadge.jsx';

describe('ReservationBadge', () => {
  it('renders a label for known statuses', () => {
    render(<ReservationBadge status="waiting_for_stock" />);
    expect(screen.getByText('Waiting for stock')).toHaveClass('badge-amber');
  });

  it('renders nothing for unknown statuses', () => {
    const { container } = render(<ReservationBadge status="none" />);
    expect(container).toBeEmptyDOMElement();
  });
});
