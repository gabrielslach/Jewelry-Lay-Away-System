import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import galleryPage from '../../mock-server/gallery-items.json';
import App from '../../src/App.jsx';

function renderRegister(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function submitForm() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Pat Patron' } });
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'pat@sampleemail.com' },
  });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), {
    target: { value: 'password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Register' }));
}

describe('Register', () => {
  it('creates an account from the form', async () => {
    renderRegister('/register');
    submitForm();
    expect(await screen.findByRole('heading', { name: 'My Account' })).toBeInTheDocument();
    expect(screen.getByText('Pat Patron')).toBeInTheDocument();
  });

  it('returns to a same-site from after registering', async () => {
    const piece = galleryPage.results[0];
    renderRegister(`/register?from=${encodeURIComponent(`/collections/${piece.id}`)}`);
    submitForm();
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: piece.name })).toBeInTheDocument();
    });
  });

  it('ignores an external from', async () => {
    renderRegister(`/register?from=${encodeURIComponent('//evil.com')}`);
    submitForm();
    expect(await screen.findByRole('heading', { name: 'My Account' })).toBeInTheDocument();
  });

  it('opens scrolled to the top', () => {
    renderRegister('/register');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('links to plain sign in when opened without from', () => {
    renderRegister('/register');
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  it('keeps from on the sign in link', () => {
    renderRegister('/register?from=%2Fcollections%2F1%3Freserve%3D1');
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login?from=%2Fcollections%2F1%3Freserve%3D1',
    );
  });
});
