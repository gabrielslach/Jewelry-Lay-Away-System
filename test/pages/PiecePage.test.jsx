import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import galleryPage from '../../mock-server/gallery-items.json';
import App from '../../src/App.jsx';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import * as getGalleryPieceModule from '../../src/services/getGalleryPiece.js';

function LocationDisplay() {
  const location = useLocation();
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
}

describe('PiecePage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the piece skeleton and back link until the piece resolves', async () => {
    const piece = galleryPage.results[0];
    let resolve;
    vi.spyOn(getGalleryPieceModule, 'getGalleryPiece').mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(
      <MemoryRouter initialEntries={[`/collections/${piece.id}`]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Back to collections' })).toBeInTheDocument();
    expect(document.querySelector('.skeleton[aria-busy="true"]')).toBeInTheDocument();
    expect(document.querySelector('.piece-layout')).toBeInTheDocument();
    expect(document.querySelectorAll('.carousel-thumbs .skeleton-bone')).toHaveLength(3);
    resolve({
      id: piece.id,
      name: 'Solitaire Halo Ring',
      title: piece.title,
      category: 'Rings',
      priceLabel: '₱1',
      material: '-',
      stone: '-',
      size: '-',
      cert: 'GIA Certified',
      images: piece.images,
    });
    expect(await screen.findByRole('heading', { name: 'Solitaire Halo Ring' })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('.skeleton[aria-busy="true"]')).not.toBeInTheDocument();
    });
  });

  it('opens checkout on step 1 from ?reserve=1 and clears the param', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const piece = galleryPage.results[0];
    render(
      <MemoryRouter initialEntries={[`/collections/${piece.id}?reserve=1`]}>
        <App />
        <LocationDisplay />
      </MemoryRouter>,
    );
    expect(await screen.findByLabelText('Lay-Away Term')).toHaveValue('3');
    expect(screen.queryByLabelText(/Payment \d+ date/)).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(`/collections/${piece.id}`);
    expect(screen.getByTestId('location')).not.toHaveTextContent('reserve');
  });

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

  it('shows as-low-as from lay-away preview, not a client split', async () => {
    const piece = galleryPage.results[0];
    render(
      <MemoryRouter initialEntries={[`/collections/${piece.id}`]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Solitaire Halo Ring' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/as low as ₱.+\/payment/)).toBeInTheDocument();
    const equalSplit = Math.round(Number(piece.price) / 6);
    expect(screen.queryByText(`as low as ₱${equalSplit.toLocaleString('en-US')}/payment`)).toBeNull();
  });

  it('shows as-low-as from lay-away preview, not a client split', async () => {
    const piece = galleryPage.results[0];
    render(
      <MemoryRouter initialEntries={[`/collections/${piece.id}`]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Solitaire Halo Ring' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/as low as ₱.+\/payment/)).toBeInTheDocument();
    const equalSplit = Math.round(Number(piece.price) / 6);
    expect(screen.queryByText(`as low as ₱${equalSplit.toLocaleString('en-US')}/payment`)).toBeNull();
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

  describe('photo zoom', () => {
    const zoomPiece = {
      id: 1,
      name: 'Solitaire Halo Ring',
      title: 'PJ1',
      category: 'Rings',
      priceLabel: '₱1',
      material: '-',
      stone: '-',
      size: '-',
      cert: '-',
      images: [
        { url: 'https://cdn.example/o1.jpg', web_url: 'https://cdn.example/w1.jpg', thumb_url: 'https://cdn.example/t1.jpg' },
        { url: 'https://cdn.example/o2.jpg', web_url: 'https://cdn.example/w2.jpg', thumb_url: 'https://cdn.example/t2.jpg' },
      ],
    };

    function renderPage() {
      vi.spyOn(getGalleryPieceModule, 'getGalleryPiece').mockResolvedValue(zoomPiece);
      render(
        <MemoryRouter initialEntries={['/collections/1']}>
          <App />
        </MemoryRouter>,
      );
    }

    it('uses web for the eager main image and thumb for lazy thumbnails', async () => {
      renderPage();
      const main = await screen.findByRole('img', { name: 'Solitaire Halo Ring photo 1' });
      expect(main).toHaveAttribute('src', 'https://cdn.example/w1.jpg');
      expect(main).toHaveAttribute('loading', 'eager');
      const thumbImg = screen.getByRole('button', { name: 'Show photo 2' }).querySelector('img');
      expect(thumbImg).toHaveAttribute('src', 'https://cdn.example/t2.jpg');
      expect(thumbImg).toHaveAttribute('loading', 'lazy');
    });

    it('opens the original only on tap and returns focus on close', async () => {
      renderPage();
      const trigger = await screen.findByRole('button', {
        name: 'Zoom photo 1: Solitaire Halo Ring',
      });
      expect(document.querySelector('img[src="https://cdn.example/o1.jpg"]')).toBeNull();
      fireEvent.click(trigger);
      const dialog = await screen.findByRole('dialog');
      const original = dialog.querySelector('img[src="https://cdn.example/o1.jpg"]');
      expect(original).toHaveAttribute('alt', 'Solitaire Halo Ring photo 1');
      expect(within(dialog).getByRole('heading', { name: 'Solitaire Halo Ring' })).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it('shows Original unavailable when the original fails', async () => {
      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: /Zoom photo 1/ }));
      const dialog = await screen.findByRole('dialog');
      fireEvent.error(dialog.querySelector('img[src="https://cdn.example/o1.jpg"]'));
      expect(within(dialog).getByText('Original unavailable.')).toBeInTheDocument();
    });

    it('zooms the selected photo and hides zoom when the main image fails', async () => {
      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: 'Show photo 2' }));
      expect(screen.getByRole('button', { name: 'Zoom photo 2: Solitaire Halo Ring' })).toBeInTheDocument();
      fireEvent.error(screen.getByRole('img', { name: 'Solitaire Halo Ring photo 2' }));
      expect(screen.queryByRole('button', { name: /^Zoom photo/ })).not.toBeInTheDocument();
    });
  });
});
