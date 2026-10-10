import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ChangePasswordForm from '../../src/components/ChangePasswordForm.jsx';
import { ToastProvider } from '../../src/components/ToastProvider.jsx';
import { ServiceError } from '../../src/services/http.js';

describe('ChangePasswordForm', () => {
  it('requires matching passwords of at least 8 characters', async () => {
    const onSubmit = vi.fn();
    render(
      <ToastProvider>
        <ChangePasswordForm onSubmit={onSubmit} />
      </ToastProvider>,
    );
    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'password' },
    });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'different' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText('At least 8 characters.')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('maps a wrong current password to an inline error', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ServiceError('Current password is incorrect', 401));
    render(
      <ToastProvider>
        <ChangePasswordForm onSubmit={onSubmit} />
      </ToastProvider>,
    );
    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'password' },
    });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'newpassword' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'newpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText('Current password is incorrect.')).toBeInTheDocument();
  });

  it('toasts success after a valid change', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });
    render(
      <ToastProvider>
        <ChangePasswordForm onSubmit={onSubmit} />
      </ToastProvider>,
    );
    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'password' },
    });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'newpassword' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'newpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    expect(screen.getByText('Password changed.')).toBeInTheDocument();
  });
});
