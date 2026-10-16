import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider } from '../../src/components/SessionProvider.jsx';
import { ToastProvider } from '../../src/components/ToastProvider.jsx';
import Home from '../../src/pages/Home.jsx';
import * as getGalleryPieceModule from '../../src/services/getGalleryPiece.js';

function renderHome() {
  return render(
    <MemoryRouter>
      <SessionProvider>
        <ToastProvider>
          <Home />
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe('Home', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the hero headline', async () => {
    renderHome();
    expect(
      screen.getByRole('heading', {
        name: /reserve the piece\.\s*pay on your terms\./i,
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Handpicked Pieces' }),
    ).toBeInTheDocument();
  });

  it('opens the piece modal skeleton before the piece resolves', async () => {
    let resolve;
    vi.spyOn(getGalleryPieceModule, 'getGalleryPiece').mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    renderHome();
    const buttons = await screen.findAllByRole('button', { name: 'View Details' });
    fireEvent.click(buttons[0]);
    expect(
      screen.getByRole('dialog', { name: 'Solitaire Halo Ring' }),
    ).toBeInTheDocument();
    expect(document.querySelector('.modal-body .skeleton[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByText('GIA Certified')).not.toBeInTheDocument();
    resolve({
      id: 1,
      name: 'Solitaire Halo Ring',
      category: 'Rings',
      price: 1000,
      material: 'Gold',
      stone: 'Diamond',
      size: '6',
      cert: 'GIA Certified',
      images: [],
    });
    expect(await screen.findByText('GIA Certified')).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('.modal-body .skeleton[aria-busy="true"]')).not.toBeInTheDocument();
    });
  });

  it('opens piece details from the gallery', async () => {
    renderHome();
    const buttons = await screen.findAllByRole('button', { name: 'View Details' });
    fireEvent.click(buttons[0]);
    expect(await screen.findByText('GIA Certified')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Solitaire Halo Ring' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reserve This Piece' }));
    expect(
      await screen.findByRole('dialog', { name: 'Reserve on Lay-Away' }),
    ).toBeInTheDocument();
  });
});
