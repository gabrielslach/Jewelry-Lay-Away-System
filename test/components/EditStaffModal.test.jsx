import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EditStaffModal from '../../src/components/EditStaffModal.jsx';
import { ServiceError } from '../../src/services/http.js';
import * as updateModule from '../../src/services/updateAdminStaff.js';
import { signInAdmin, signOutAdmin } from '../helpers/adminAuth.js';

const accountant = {
  id: 2,
  name: 'Sample Accountant',
  email: 'accounting@samplejewelry.example',
  role: 'accounting',
  is_active: true,
};

function renderModal(props = {}) {
  const onSaved = vi.fn();
  render(
    <EditStaffModal
      member={accountant}
      isSelf={false}
      isLastAdmin={false}
      full={[]}
      onClose={() => {}}
      onSaved={onSaved}
      {...props}
    />,
  );
  return onSaved;
}

describe('EditStaffModal', () => {
  beforeEach(signInAdmin);
  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('shows the email and disables Save until something changes', () => {
    renderModal();
    expect(screen.getByText(accountant.email)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Renamed' },
    });
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  it('sends only the changed fields', async () => {
    const spy = vi
      .spyOn(updateModule, 'updateAdminStaff')
      .mockResolvedValue({ id: 2 });
    const onSaved = renderModal();
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Renamed' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith(2, { name: 'Renamed' });
  });

  it('requires an 8 character new password', () => {
    const spy = vi.spyOn(updateModule, 'updateAdminStaff');
    renderModal();
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(
      screen.getByText('At least 8 characters.', { selector: '.field-error' }),
    ).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('locks role and active for your own account but keeps name editable', () => {
    renderModal({ isSelf: true });
    expect(screen.getByLabelText('Role')).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Active' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByText(/can't change your own role/)).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeEnabled();
  });

  it('locks role and active for the last active admin', () => {
    renderModal({ isLastAdmin: true });
    expect(screen.getByLabelText('Role')).toBeDisabled();
    expect(screen.getByText(/last active admin/)).toBeInTheDocument();
  });

  it('disables the other role when its cap is full', () => {
    renderModal({ full: ['admin'] });
    expect(
      screen.getByRole('option', { name: 'Admin (limit reached)' }),
    ).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Accounting' })).toBeEnabled();
  });

  it('blocks reactivation when the role cap is full', () => {
    renderModal({
      member: { ...accountant, is_active: false },
      full: ['accounting'],
    });
    expect(screen.getByRole('switch', { name: 'Active' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByText(/Accounting limit reached/)).toBeInTheDocument();
  });

  it('shows API errors inline', async () => {
    vi.spyOn(updateModule, 'updateAdminStaff').mockRejectedValue(
      new ServiceError('Role full', 409),
    );
    const onSaved = renderModal();
    fireEvent.click(screen.getByRole('switch', { name: 'Active' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Role full');
    expect(onSaved).not.toHaveBeenCalled();
  });
});
