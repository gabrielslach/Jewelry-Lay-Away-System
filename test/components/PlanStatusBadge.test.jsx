import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PlanStatusBadge from '../../src/components/PlanStatusBadge.jsx';

describe('PlanStatusBadge', () => {
  it.each([
    ['on_track', 'On Track', 'badge-ok'],
    ['overdue', 'Overdue', 'badge-warn'],
    ['completed', 'Completed', 'badge-info'],
    ['cancelled', 'Cancelled', 'badge-mute'],
    ['defaulted', 'Defaulted', 'badge-warn'],
  ])('renders %s as %s', (status, label, className) => {
    render(<PlanStatusBadge status={status} />);
    expect(screen.getByText(label)).toHaveClass('badge', className);
  });

  it('renders nothing for an unknown status', () => {
    const { container } = render(<PlanStatusBadge status="weird" />);
    expect(container).toBeEmptyDOMElement();
  });
});
