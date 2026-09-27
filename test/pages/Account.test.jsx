import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App.jsx';
import { SessionProvider } from '../../src/components/SessionProvider.jsx';
import Account from '../../src/pages/Account.jsx';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import { getCustomer, setCustomerToken } from '../../src/services/session.js';
import * as getCustomerOrdersModule from '../../src/services/getCustomerOrders.js';

function signIn() {
  return loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
}

function renderApp(path = '/account') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function chromeLink(name) {
  const nav = screen.getByRole('navigation', { name: 'Storefront' });
  return within(nav).getByRole('link', { name });
}

describe('Account', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows order skeletons without empty copy or a zero active count while loading', async () => {
    await signIn();
    let resolve;
    vi.spyOn(getCustomerOrdersModule, 'getCustomerOrders').mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(
      <MemoryRouter>
        <SessionProvider>
          <Account />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(document.querySelector('.skeleton[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByText('No active lay-aways right now.')).not.toBeInTheDocument();
    expect(screen.queryByText('No completed lay-aways yet.')).not.toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    resolve({ active: [], completed: [] });
    expect(await screen.findByText('No active lay-aways right now.')).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('.skeleton[aria-busy="true"]')).not.toBeInTheDocument();
    });
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows Sample Client lay-aways after login', async () => {
    await signIn();
    render(
      <MemoryRouter>
        <SessionProvider>
          <Account />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Sample Client')).toBeInTheDocument();
    expect(await screen.findByText(/Solitaire Halo Ring/)).toBeInTheDocument();
    expect(screen.getByText(/Vintage Rose Pendant/)).toBeInTheDocument();
    expect(screen.getByText('On Track')).toBeInTheDocument();
    expect(screen.getByText(/Next Due Oct 25/)).toBeInTheDocument();
    expect(screen.getByText(/Completed Jul 2026/)).toBeInTheDocument();
  });

  it('loads lay-aways in a new tab with only the stored refresh token', async () => {
    await signIn();
    sessionStorage.clear();
    renderApp();
    expect(screen.getByRole('heading', { name: 'My Account' })).toBeInTheDocument();
    expect(await screen.findByText(/Vintage Rose Pendant/)).toBeInTheDocument();
    expect(chromeLink('My Account')).toHaveAttribute('href', '/account');
  });

  it('sends the shopper to sign in when the refresh token is revoked', async () => {
    await signIn();
    setCustomerToken('expired');
    localStorage.setItem('customerRefreshToken', 'revoked');
    renderApp();
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(chromeLink('Sign in')).toHaveAttribute('href', '/login');
  });

  it('signs out to the sign-in page', async () => {
    await signIn();
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(chromeLink('Sign in')).toHaveAttribute('href', '/login');
    expect(getCustomer()).toBeNull();
  });

  it('handles a double-tap on Sign out without an error', async () => {
    await signIn();
    renderApp();
    const signOut = screen.getByRole('button', { name: 'Sign out' });
    fireEvent.click(signOut);
    fireEvent.click(signOut);
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(chromeLink('Sign in')).toHaveAttribute('href', '/login');
    expect(getCustomer()).toBeNull();
  });

  it('still signs out when the logout call fails', async () => {
    await signIn();
    const mockFetch = globalThis.fetch;
    vi.stubGlobal('fetch', async (url, init) => {
      if (url === '/api/customers/logout') {
        throw new TypeError('offline');
      }
      return mockFetch(url, init);
    });
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(getCustomer()).toBeNull();
  });
});
