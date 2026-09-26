import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
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
});
