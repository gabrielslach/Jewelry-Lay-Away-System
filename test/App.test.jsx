import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../src/App.jsx';

describe('App', () => {
  it('renders the home page', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: /reserve the piece\.\s*pay on your terms\./i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Solitaire Halo Ring' }),
    ).toBeInTheDocument();
  });

  it('sends signed-out account visits to login', () => {
    render(
      <MemoryRouter initialEntries={['/account']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders the admin dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(await screen.findByText('Active Lay-Aways')).toBeInTheDocument();
  });

  it('keeps admin nested paths on the admin chrome', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Orders & Installments' }),
    ).toBeInTheDocument();
  });
});
