import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { SessionProvider } from '../../../src/components/SessionProvider.jsx';
import AdminLogin from '../../../src/pages/admin/Login.jsx';
import { signOutAdmin } from '../../helpers/adminAuth.js';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

describe('AdminLogin', () => {
  afterEach(() => {
    signOutAdmin();
  });

  it('signs in and returns to the from path', async () => {
    signOutAdmin();
    render(
      <MemoryRouter initialEntries={['/admin/login?from=%2Fadmin%2Forders']}>
        <SessionProvider>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/orders"
              element={
                <>
                  <h1>Orders & Installments</h1>
                  <LocationDisplay />
                </>
              }
            />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(
      await screen.findByRole('heading', { name: 'Orders & Installments' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/orders');
  });
});
