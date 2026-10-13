import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatTiles, { StatTile } from '../../src/components/StatTiles.jsx';

describe('StatTiles', () => {
  it('shows a labelled value', () => {
    render(
      <StatTiles>
        <StatTile label="Entries shown" value={25} />
      </StatTiles>,
    );
    expect(screen.getByText('Entries shown')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('shows labelled sub-lines and an emphasis style without a value', () => {
    const { container } = render(
      <StatTile
        label="Interest profit"
        lines={[{ label: 'Realized', value: '₱1.00' }]}
        emphasis
      />,
    );
    expect(screen.getByText('Realized:')).toBeInTheDocument();
    expect(screen.getByText('₱1.00')).toBeInTheDocument();
    expect(container.querySelector('.stat-value')).toBeNull();
    expect(container.firstChild).toHaveClass('stat-tile-emphasis');
  });
});
