import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './Home.jsx';

describe('Home', () => {
  it('renders the hero headline', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', {
        name: /reserve the piece you love/i,
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Handpicked Pieces' }),
    ).toBeInTheDocument();
  });

  it('opens piece details from the gallery', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    const buttons = await screen.findAllByRole('button', { name: 'View Details' });
    fireEvent.click(buttons[0]);
    expect(
      await screen.findByRole('dialog', { name: 'Solitaire Halo Ring' }),
    ).toBeInTheDocument();
    expect(screen.getByText('GIA Certified')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reserve This Piece' }));
    expect(
      await screen.findByRole('dialog', { name: 'Reserve on Lay-Away' }),
    ).toBeInTheDocument();
  });
});
