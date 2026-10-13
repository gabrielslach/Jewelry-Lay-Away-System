import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

  it('lazy loads and decodes async by default, and honours loading="eager"', () => {
    const { rerender } = render(<PieceImage src="https://cdn.example/a.jpg" alt="A" />);
    expect(screen.getByRole('img', { name: 'A' })).toHaveAttribute('loading', 'lazy');
    expect(screen.getByRole('img', { name: 'A' })).toHaveAttribute('decoding', 'async');
    rerender(<PieceImage src="https://cdn.example/a.jpg" alt="A" loading="eager" />);
    expect(screen.getByRole('img', { name: 'A' })).toHaveAttribute('loading', 'eager');
  });

  it('calls onError when the image fails', () => {
    const onError = vi.fn();
    render(<PieceImage src="https://cdn.example/b.jpg" alt="B" title="B" onError={onError} />);
    fireEvent.error(screen.getByRole('img', { name: 'B' }));
    expect(onError).toHaveBeenCalled();
  });
});
