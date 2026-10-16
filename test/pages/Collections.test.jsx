import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';
import * as getGalleryModule from '../../src/services/getGallery.js';

describe('Collections', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('paginates the catalog', async () => {
    render(
      <MemoryRouter initialEntries={['/collections']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Solitaire Halo Ring' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Page 2')).toBeInTheDocument();
  });

  it('shows twelve card skeletons and disables the pager while a page fetch is pending', async () => {
    const realGetGallery = getGalleryModule.getGallery;
    let resolvePage2;
    vi.spyOn(getGalleryModule, 'getGallery').mockImplementation((opts) => {
      if (opts?.page === 2) {
        return new Promise((done) => {
          resolvePage2 = done;
        });
      }
      return realGetGallery(opts);
    });
    render(
      <MemoryRouter initialEntries={['/collections']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Solitaire Halo Ring' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(document.querySelector('.skeleton[aria-busy="true"]')).toBeInTheDocument();
    expect(document.querySelectorAll('.gallery-grid .piece-card')).toHaveLength(12);
    expect(screen.queryByRole('heading', { name: 'Solitaire Halo Ring' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    resolvePage2(await realGetGallery({ page: 2, pageSize: 12 }));
    expect(await screen.findByText('Page 2')).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('.skeleton[aria-busy="true"]')).not.toBeInTheDocument();
    });
  });
});
