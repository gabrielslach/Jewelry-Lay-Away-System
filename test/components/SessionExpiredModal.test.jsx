import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import SessionExpiredModal from '../../src/components/SessionExpiredModal.jsx';
import { setAdminSession, getAdminRefreshToken } from '../../src/services/session.js';
import { emitSessionExpired } from '../../src/services/sessionExpired.js';

function Where() {
  const { pathname, search } = useLocation();
  return <p data-testid="where">{`${pathname}${search}`}</p>;
}

function renderModal(scope, path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <SessionExpiredModal scope={scope} />
      <Routes>
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SessionExpiredModal', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('is hidden until its scope expires', () => {
    renderModal('customer', '/account');
    act(() => emitSessionExpired('admin'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => emitSessionExpired('customer'));
    expect(screen.getByRole('dialog', { name: 'Sign in to continue' })).toBeInTheDocument();
    expect(
      screen.getByText('Your session has expired. Please sign in again to continue.'),
    ).toBeInTheDocument();
  });

  it('cannot be dismissed', () => {
    renderModal('customer', '/account');
    act(() => emitSessionExpired('customer'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('sends customers to login with the current path', () => {
    renderModal('customer', '/account?tab=plans');
    act(() => emitSessionExpired('customer'));
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByTestId('where')).toHaveTextContent(
      `/login?from=${encodeURIComponent('/account?tab=plans')}`,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clears the admin session and sends staff to admin login', () => {
    setAdminSession({ access_token: 'a', refresh_token: 'r', admin: { id: 1 } });
    renderModal('admin', '/admin/orders');
    act(() => emitSessionExpired('admin'));
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(getAdminRefreshToken()).toBeNull();
    expect(screen.getByTestId('where')).toHaveTextContent(
      `/admin/login?from=${encodeURIComponent('/admin/orders')}`,
    );
  });
});
