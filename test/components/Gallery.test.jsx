import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Gallery from '../../src/components/Gallery.jsx';

describe('Gallery', () => {
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
});
