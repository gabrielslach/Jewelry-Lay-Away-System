import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToastProvider } from '../../src/components/ToastProvider.jsx';
import Home from '../../src/pages/Home.jsx';

function renderHome() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <Home />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('Home', () => {
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

  it('opens piece details from the gallery', async () => {
    renderHome();
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
