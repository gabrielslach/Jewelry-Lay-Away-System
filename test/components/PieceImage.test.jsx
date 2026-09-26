import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PieceImage from '../../src/components/PieceImage.jsx';

describe('PieceImage', () => {
  it('shows an img when the URL loads', () => {
    render(
      <PieceImage src="https://cdn.example/piece.jpg" alt="Ring photo" title="Ring" />,
    );
    expect(screen.getByRole('img', { name: 'Ring photo' })).toHaveAttribute(
      'src',
      'https://cdn.example/piece.jpg',
    );
  });

  it('shows GemMark when the URL is missing', () => {
    render(<PieceImage title="Solitaire Halo Ring" />);
    expect(screen.getByRole('img', { name: 'Solitaire Halo Ring' })).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('replaces a broken img with GemMark on error', () => {
    render(
      <PieceImage
        src="https://cdn.example/broken.jpg"
        alt="Ring photo"
        title="Solitaire Halo Ring"
      />,
    );
    fireEvent.error(screen.getByRole('img', { name: 'Ring photo' }));
    expect(screen.getByRole('img', { name: 'Solitaire Halo Ring' })).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('retries loading when the src changes after a failure', () => {
    const { rerender } = render(
      <PieceImage
        src="https://cdn.example/broken.jpg"
        alt="Ring photo"
        title="Solitaire Halo Ring"
      />,
    );
    fireEvent.error(screen.getByRole('img', { name: 'Ring photo' }));
    expect(document.querySelector('img')).toBeNull();

    rerender(
      <PieceImage
        src="https://cdn.example/ok.jpg"
        alt="Ring photo"
        title="Solitaire Halo Ring"
      />,
    );
    expect(screen.getByRole('img', { name: 'Ring photo' })).toHaveAttribute(
      'src',
      'https://cdn.example/ok.jpg',
    );
  });
});
