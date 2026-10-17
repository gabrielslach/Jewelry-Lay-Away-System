import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PieceSpecs from '../../src/components/PieceSpecs.jsx';

describe('PieceSpecs', () => {
  it('shows Material, Stone, Weight, and Type tiles in order', () => {
    render(
      <PieceSpecs
        piece={{ material: 'Yellow gold 18K', stone: 'Diamond', weight: '9.85 g', type: 'Necklaces (NL)' }}
      />,
    );
    const [material, stone, weight, type] = ['Material', 'Stone', 'Weight', 'Type'].map((label) =>
      screen.getByText(label),
    );
    const follows = (first, second) =>
      Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(material, stone)).toBe(true);
    expect(follows(stone, weight)).toBe(true);
    expect(follows(weight, type)).toBe(true);
    expect(screen.getByText('Yellow gold 18K')).toBeInTheDocument();
    expect(screen.getByText('9.85 g')).toBeInTheDocument();
    expect(screen.getByText('Necklaces (NL)')).toBeInTheDocument();
    expect(screen.getByText('Diamond')).toBeInTheDocument();
  });

  it('does not render a tile without a value', () => {
    render(<PieceSpecs piece={{ material: 'Platinum', stone: null, weight: '', type: null }} />);
    expect(screen.getByText('Material')).toBeInTheDocument();
    for (const label of ['Stone', 'Weight', 'Type']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it('renders nothing when every value is empty', () => {
    const { container } = render(
      <PieceSpecs piece={{ material: null, stone: null, weight: null, type: null }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
