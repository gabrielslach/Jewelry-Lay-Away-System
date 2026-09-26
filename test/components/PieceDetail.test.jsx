import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PieceDetail from '../../src/components/PieceDetail.jsx';

const piece = {
  id: 1,
  name: 'Solitaire Halo Ring',
  category: 'Rings',
  price: 48500,
  material: '18K White Gold',
  stone: '0.75ct Diamond',
  size: 'US 6 (resizable)',
  cert: 'GIA Certified',
};

describe('PieceDetail', () => {
  it('shows specs and reserve action', () => {
    const onReserve = vi.fn();
    render(<PieceDetail piece={piece} onClose={() => {}} onReserve={onReserve} />);
    expect(screen.getByRole('dialog', { name: 'Solitaire Halo Ring' })).toBeInTheDocument();
    expect(screen.getByText('18K White Gold')).toBeInTheDocument();
    expect(screen.getByText('Lay-Away Available')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reserve This Piece' }));
    expect(onReserve).toHaveBeenCalledWith(piece);
  });
});
