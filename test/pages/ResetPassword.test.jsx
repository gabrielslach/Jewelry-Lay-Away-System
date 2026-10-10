import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ResetPassword from '../../src/pages/ResetPassword.jsx';
import Login from '../../src/pages/Login.jsx';
import { SessionProvider } from '../../src/components/SessionProvider.jsx';
import * as customerPassword from '../../src/services/customerPassword.js';
import { ServiceError } from '../../src/services/http.js';

describe('ResetPassword', () => {
  it('routes to login with a notice after a successful reset', async () => {
    vi.spyOn(customerPassword, 'resetCustomerPassword').mockResolvedValue({ ok: true });
    render(
      <MemoryRouter initialEntries={['/reset-password?token=abc']}>
        <SessionProvider>
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'newpassword' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'newpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText('Password updated. Please sign in.')).toBeInTheDocument();
  });

  it('shows a page message with a forgot-password link for bad tokens', async () => {
    vi.spyOn(customerPassword, 'resetCustomerPassword').mockRejectedValue(
      new ServiceError('Invalid or expired token', 400),
    );
    render(
      <MemoryRouter initialEntries={['/reset-password?token=bad']}>
        <ResetPassword />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'newpassword' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'newpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(
      await screen.findByText('This link is invalid, used, or expired.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });
});
