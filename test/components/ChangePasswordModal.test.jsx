import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ChangePasswordModal from '../../src/components/ChangePasswordModal.jsx';
import { ToastProvider } from '../../src/components/ToastProvider.jsx';

describe('ChangePasswordModal', () => {
  it('keeps the form hidden until the trigger is clicked', () => {
    render(
      <ToastProvider>
        <ChangePasswordModal onSubmit={vi.fn()} />
      </ToastProvider>,
    );
    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName('Change password');
    expect(within(dialog).getByLabelText('Current password')).toBeInTheDocument();
    expect(within(dialog).queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('closes after a successful password change', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });
    render(
      <ToastProvider>
        <ChangePasswordModal onSubmit={onSubmit} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Current password'), {
      target: { value: 'password' },
    });
    fireEvent.change(within(dialog).getByLabelText('New password'), {
      target: { value: 'newpassword' },
    });
    fireEvent.change(within(dialog).getByLabelText('Confirm password'), {
      target: { value: 'newpassword' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Change password' }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Password changed.')).toBeInTheDocument();
  });
});
