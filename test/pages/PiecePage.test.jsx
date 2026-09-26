import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import galleryPage from '../../mock-server/gallery-items.json';
import App from '../../src/App.jsx';

describe('PiecePage', () => {
  it('shows the CDN photo and details', async () => {
    const piece = galleryPage.results[0];
    render(
      <MemoryRouter initialEntries={[`/collections/${piece.id}`]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Solitaire Halo Ring' }),
    ).toBeInTheDocument();
    expect(screen.getByText('GIA Certified')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /solitaire halo ring photo/i })).toHaveAttribute(
      'src',
      piece.images[0].url,
    );
  });

  it('shows GemMark for a failed main image and a failed thumb', async () => {
    const piece = galleryPage.results.find((item) => item.images.length > 1);
    render(
      <MemoryRouter initialEntries={[`/collections/${piece.id}`]}>
        <App />
      </MemoryRouter>,
    );

    const main = await screen.findByRole('img', { name: /photo 1/i });
    fireEvent.error(main);
    expect(document.querySelector('.carousel-main img')).toBeNull();
    expect(document.querySelector('.carousel-main .gem-mark')).toBeInTheDocument();

    const thumb = screen.getByRole('button', { name: 'Show photo 2' });
    expect(thumb).toHaveClass('thumb');
    fireEvent.error(thumb.querySelector('img'));
    expect(thumb.querySelector('img')).toBeNull();
    expect(within(thumb).getByRole('img')).toHaveClass('gem-mark');
    expect(thumb).toHaveClass('thumb');
  });
});
