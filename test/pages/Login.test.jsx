import { MemoryRouter } from 'react-router-dom';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import galleryPage from '../../mock-server/gallery-items.json';
import App from '../../src/App.jsx';
import { loginCustomer } from '../../src/services/loginCustomer.js';

function renderLogin(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('Login', () => {
  it('signs in the seeded customer', async () => {
    renderLogin('/login');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(
      await screen.findByRole('heading', { name: 'My Account' }),
    ).toBeInTheDocument();
    expect(screen.getByText('client@sampleemail.com')).toBeInTheDocument();
  });

  it('returns to a same-site from after sign-in', async () => {
    const piece = galleryPage.results[0];
    renderLogin(
      `/login?from=${encodeURIComponent(`/collections/${piece.id}`)}`,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: piece.name }),
      ).toBeInTheDocument();
    });
  });

  it('ignores an external from', async () => {
    renderLogin(`/login?from=${encodeURIComponent('//evil.com')}`);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(
      await screen.findByRole('heading', { name: 'My Account' }),
    ).toBeInTheDocument();
  });

  it('opens scrolled to the top', () => {
    renderLogin('/login');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('links to plain register when opened without from', () => {
    renderLogin('/login');
    expect(
      screen.getByRole('link', { name: 'Create an account' }),
    ).toHaveAttribute('href', '/register');
  });

  it('keeps from on the create account link', () => {
    renderLogin('/login?from=%2Fcollections%2F1%3Freserve%3D1');
    expect(
      screen.getByRole('link', { name: 'Create an account' }),
    ).toHaveAttribute(
      'href',
      '/register?from=%2Fcollections%2F1%3Freserve%3D1',
    );
  });

  it('links the terms and privacy policy near the submit button', () => {
    renderLogin('/login');
    const agreement = screen.getByText(/By signing in, you agree to our/);
    expect(agreement).toBeInTheDocument();
    expect(
      within(agreement).getByRole('link', { name: 'Terms and Conditions' }),
    ).toHaveAttribute('href', '/terms');
    expect(
      within(agreement).getByRole('link', { name: 'Privacy Policy' }),
    ).toHaveAttribute('href', '/privacy');
  });

  it('redirects to the from path when already signed in', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    renderLogin('/login');
    expect(await screen.findByRole('heading', { name: 'My Account' })).toBeInTheDocument();
  });
});
