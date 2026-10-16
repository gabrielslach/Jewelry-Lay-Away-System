import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Gallery from '../../src/components/Gallery.jsx';
import * as getGalleryModule from '../../src/services/getGallery.js';

describe('Gallery', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders collection cards from the demo catalog', async () => {
    render(
      <MemoryRouter>
        <Gallery />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Solitaire Halo Ring' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'View Details' })).toHaveLength(
      6,
    );
  });

  it('shows piece-card skeletons until the catalog resolves', async () => {
    let resolve;
    vi.spyOn(getGalleryModule, 'getGallery').mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(
      <MemoryRouter>
        <Gallery />
      </MemoryRouter>,
    );
    expect(document.querySelector('.skeleton[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(document.querySelectorAll('.gallery-grid .piece-card')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: 'View Details' })).not.toBeInTheDocument();
    resolve({
      results: [
        {
          id: 99,
          name: 'Deferred Ring',
          title: 'DR-99',
          category: 'Rings',
          priceLabel: '₱1',
          perPaymentLabel: '₱1',
          images: [],
        },
      ],
      next: null,
      previous: null,
      count: 1,
    });
    expect(await screen.findByRole('heading', { name: 'Deferred Ring' })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('.skeleton[aria-busy="true"]')).not.toBeInTheDocument();
    });
  });
});
