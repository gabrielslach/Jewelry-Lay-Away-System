import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Checkout from '../../src/components/Checkout.jsx';
import { SessionProvider } from '../../src/components/SessionProvider.jsx';
import { ToastProvider } from '../../src/components/ToastProvider.jsx';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import { getGallery } from '../../src/services/getGallery.js';
import { clearCustomerSession, setCustomerToken } from '../../src/services/session.js';

const piece = { id: 1, name: 'Solitaire Halo Ring', price: 48000 };

function LocationDisplay() {
  const location = useLocation();
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
}

function renderCheckout(ui, { path = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  {ui}
                  <LocationDisplay />
                </>
              }
            />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

async function waitForPreview() {
  expect(await screen.findByLabelText('Lay-Away Term')).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: 'Down payment' })).toBeInTheDocument();
}

describe('Checkout', () => {
  beforeEach(async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const page = await getGallery({ pageSize: 1 });
    piece.id = page.results[0].id;
  });

  it('shows the term select and schedule from preview without a date picker', async () => {
    renderCheckout(<Checkout piece={piece} onClose={() => {}} />);
    await waitForPreview();
    expect(screen.queryByLabelText(/Payment \d+ date/)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Payment schedule' })).toBeInTheDocument();
    expect(screen.getAllByText(/Payment \d+/)).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Confirm lay-away' })).toBeEnabled();
  });

  it('creates a plan on confirm and opens the down-payment form', async () => {
    const onScheduled = vi.fn();
    renderCheckout(<Checkout piece={piece} onClose={() => {}} onScheduled={onScheduled} />);
    await waitForPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm lay-away' }));
    await vi.waitFor(() => {
      expect(onScheduled).toHaveBeenCalled();
    });
    expect(onScheduled.mock.calls[0][0].plan.term_months).toBe(3);
    expect(
      await screen.findByText(/Step 1: transfer .+ to one of our accounts/),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pay down payment' })).toBeInTheDocument();
  });

  it('redirects to the account page when closed after a plan is created', async () => {
    const onClose = vi.fn();
    renderCheckout(<Checkout piece={piece} onClose={onClose} />);
    await waitForPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm lay-away' }));
    expect(
      await screen.findByRole('heading', { name: 'Pay down payment' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/account\?plan=LA-/);
  });

  it('stays on the page when closed before a plan is created', async () => {
    const onClose = vi.fn();
    renderCheckout(<Checkout piece={piece} onClose={onClose} />, { path: '/collections/1' });
    await waitForPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('location')).toHaveTextContent('/collections/1');
  });

  it('creates the plan in a new tab without bouncing to login', async () => {
    sessionStorage.clear();
    const onScheduled = vi.fn();
    renderCheckout(<Checkout piece={piece} onClose={() => {}} onScheduled={onScheduled} />, {
      path: '/collections/1',
    });
    await waitForPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm lay-away' }));
    await vi.waitFor(() => {
      expect(onScheduled).toHaveBeenCalled();
    });
    expect(screen.getByTestId('location')).toHaveTextContent('/collections/1');
  });

  it('asks the shopper to sign in when the refresh token is revoked', async () => {
    setCustomerToken('expired');
    localStorage.setItem('customerRefreshToken', 'revoked');
    renderCheckout(<Checkout piece={piece} onClose={() => {}} />);
    await waitForPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm lay-away' }));
    expect(
      await screen.findByRole('heading', { name: 'Sign in to reserve' }),
    ).toBeInTheDocument();
  });

  it('shows principal and interest under each schedule row', async () => {
    renderCheckout(<Checkout piece={piece} onClose={() => {}} />);
    await waitForPreview();
    expect(screen.getAllByText(/Principal ₱[\d,.]+ · Interest ₱[\d,.]+/)).toHaveLength(6);
  });

  it('asks guests to sign in instead of showing the schedule', () => {
    clearCustomerSession();
    renderCheckout(<Checkout piece={piece} onClose={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Sign in to reserve' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your lay-away plan is saved to your account so you can track payments in My Account.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Lay-Away Term')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('links guests to sign in and register with a return to the piece', () => {
    clearCustomerSession();
    renderCheckout(<Checkout piece={piece} onClose={() => {}} />);
    const from = `%2Fcollections%2F${piece.id}%3Freserve%3D1`;
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      `/login?from=${from}`,
    );
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute(
      'href',
      `/register?from=${from}`,
    );
  });

  it('skips the sign-in step for signed-in shoppers', async () => {
    renderCheckout(<Checkout piece={piece} onClose={() => {}} />);
    expect(screen.queryByRole('heading', { name: 'Sign in to reserve' })).not.toBeInTheDocument();
    await waitForPreview();
  });
});
