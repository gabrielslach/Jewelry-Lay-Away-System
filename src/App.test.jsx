import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App.jsx';

describe('App', () => {
  it('renders the home page', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: /sample jewelry co\./i }),
    ).toBeInTheDocument();
  });

  it('renders the account page', () => {
    render(
      <MemoryRouter initialEntries={['/account']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: /my account/i }),
    ).toBeInTheDocument();
  });

  it('renders the admin page', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /^admin$/i })).toBeInTheDocument();
  });

  it('keeps admin nested paths on the admin page', () => {
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /^admin$/i })).toBeInTheDocument();
  });
});
