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

describe('Checkout', () => {
  beforeEach(async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const page = await getGallery({ pageSize: 1 });
    piece.id = page.results[0].id;
  });
  it('shows six payments for the three-month term', () => {
    renderCheckout(<Checkout piece={piece} onClose={() => {}} />);
    expect(screen.getAllByLabelText(/Payment \d+ date/)).toHaveLength(6);
    expect(screen.getAllByText('₱8,000')).toHaveLength(6);
  });

  it('rebuilds the schedule when the term changes', () => {
    renderCheckout(<Checkout piece={piece} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Lay-Away Term'), { target: { value: '2' } });
    expect(screen.getAllByLabelText(/Payment \d+ date/)).toHaveLength(2);
  });

  it('puts remainder pesos on the last installment', () => {
    renderCheckout(
      <Checkout
        piece={{ id: piece.id, name: 'Solitaire Halo Ring', price: 48500 }}
        onClose={() => {}}
      />,
    );
    expect(screen.getAllByText('₱8,083')).toHaveLength(5);
    expect(screen.getByText('₱8,085')).toBeInTheDocument();
  });

  it('creates a mocked plan on continue', async () => {
    const onScheduled = vi.fn();
    renderCheckout(<Checkout piece={piece} onClose={() => {}} onScheduled={onScheduled} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await vi.waitFor(() => {
      expect(onScheduled).toHaveBeenCalled();
    });
    expect(onScheduled.mock.calls[0][0].plan.term_months).toBe(3);
  });

  it('lets the shopper pick a mocked payment method', async () => {
    const onPayMethod = vi.fn();
    renderCheckout(<Checkout piece={piece} onClose={() => {}} onPayMethod={onPayMethod} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('GCash / E-Wallet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Bank Transfer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onPayMethod).toHaveBeenCalledWith('bank');
  });

  it('shows confirmation and a toast after the mocked payment method', async () => {
    const onClose = vi.fn();
    renderCheckout(<Checkout piece={piece} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('GCash / E-Wallet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      await screen.findByRole('heading', { name: 'Reservation Submitted' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Our team will confirm your payment schedule and hold the piece for you.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Reservation submitted for Solitaire Halo Ring.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('creates the plan in a new tab without bouncing to login', async () => {
    sessionStorage.clear();
    const onScheduled = vi.fn();
    renderCheckout(<Checkout piece={piece} onClose={() => {}} onScheduled={onScheduled} />, {
      path: '/collections/1',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('GCash / E-Wallet')).toBeInTheDocument();
    expect(onScheduled).toHaveBeenCalled();
    expect(screen.getByTestId('location')).toHaveTextContent('/collections/1');
  });

  it('asks the shopper to sign in when the refresh token is revoked', async () => {
    setCustomerToken('expired');
    localStorage.setItem('customerRefreshToken', 'revoked');
    renderCheckout(<Checkout piece={piece} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      await screen.findByRole('heading', { name: 'Sign in to reserve' }),
    ).toBeInTheDocument();
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

  it('skips the sign-in step for signed-in shoppers', () => {
    renderCheckout(<Checkout piece={piece} onClose={() => {}} />);
    expect(screen.queryByRole('heading', { name: 'Sign in to reserve' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Lay-Away Term')).toBeInTheDocument();
  });
});
