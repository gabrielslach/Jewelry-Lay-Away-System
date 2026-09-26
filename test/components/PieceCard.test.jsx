import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import PieceCard from '../../src/components/PieceCard.jsx';

const piece = {
  id: 1,
  name: 'Solitaire Halo Ring',
  category: 'Rings',
  price: 48500,
};

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderCard(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('PieceCard', () => {
  it('shows name, category, price, and as-low-as copy', () => {
    renderCard(<PieceCard piece={piece} />);
    expect(screen.getByText('Rings')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Solitaire Halo Ring' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/₱48,500/)).toBeInTheDocument();
    expect(screen.getByText(/or as low as ₱8,083\/payment/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Solitaire Halo Ring' })).toBeInTheDocument();
  });

  it('shows an img when the piece has a photo URL', () => {
    renderCard(
      <PieceCard
        piece={{
          ...piece,
          images: [{ url: 'https://cdn.example/ring.jpg', is_primary: true }],
        }}
      />,
    );
    expect(document.querySelector('.piece-media img')).toHaveAttribute(
      'src',
      'https://cdn.example/ring.jpg',
    );
  });

  it('replaces a broken photo with GemMark', () => {
    renderCard(
      <PieceCard
        piece={{
          ...piece,
          images: [{ url: 'https://cdn.example/broken.jpg', is_primary: true }],
        }}
      />,
    );
    fireEvent.error(document.querySelector('.piece-media img'));
    expect(document.querySelector('.piece-media img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Solitaire Halo Ring' })).toHaveClass(
      'gem-mark',
    );
  });

  it('notifies when View Details is clicked', () => {
    const onViewDetails = vi.fn();
    renderCard(<PieceCard piece={piece} onViewDetails={onViewDetails} />);
    fireEvent.click(screen.getByRole('button', { name: 'View Details' }));
    expect(onViewDetails).toHaveBeenCalledWith(piece);
  });

  it('opens details from media and title the same as View Details', () => {
    const onViewDetails = vi.fn();
    renderCard(<PieceCard piece={piece} onViewDetails={onViewDetails} />);
    fireEvent.click(document.querySelector('.piece-media'));
    fireEvent.click(screen.getByRole('heading', { name: 'Solitaire Halo Ring' }));
    expect(onViewDetails).toHaveBeenCalledTimes(2);
    expect(onViewDetails).toHaveBeenCalledWith(piece);
  });

  it('navigates from media and title when to is set', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <PieceCard piece={piece} to="/collections/1" />
                <LocationDisplay />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(document.querySelector('.piece-media'));
    expect(screen.getByTestId('location')).toHaveTextContent('/collections/1');
  });
});
