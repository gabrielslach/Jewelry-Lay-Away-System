import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BankAccountModal from '../../src/components/BankAccountModal.jsx';
import * as bankAccounts from '../../src/services/adminBankAccounts.js';
import { ServiceError } from '../../src/services/http.js';
import { signInAdmin, signOutAdmin } from '../helpers/adminAuth.js';

function fill(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('BankAccountModal', () => {
  beforeEach(async () => {
    await signInAdmin();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('creates an account with the entered values and the chosen QR', async () => {
    const create = vi
      .spyOn(bankAccounts, 'createAdminBankAccount')
      .mockResolvedValue({ id: 9 });
    const onSaved = vi.fn();
    render(<BankAccountModal onClose={() => {}} onSaved={onSaved} />);
    expect(
      screen.getByRole('dialog', { name: 'Add bank account' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove QR' }),
    ).not.toBeInTheDocument();
    fill('Bank name', ' New Bank ');
    fill('Account name', 'AlMar');
    fill('Account number', '12-34');
    const file = new File(['x'], 'qr.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('QR code'), {
      target: { files: [file] },
    });
    expect(screen.getByLabelText('QR code')).toHaveAttribute(
      'accept',
      'image/*',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ id: 9 }));
    expect(create).toHaveBeenCalledWith({
      bank_name: 'New Bank',
      account_name: 'AlMar',
      account_number: '12-34',
      qrFile: file,
      removeQr: false,
    });
  });

  it('shows a disabled Saving state and stays open on a general server error', async () => {
    let fail;
    vi.spyOn(bankAccounts, 'updateAdminBankAccount').mockReturnValue(
      new Promise((_, reject) => {
        fail = reject;
      }),
    );
    const onClose = vi.fn();
    render(
      <BankAccountModal
        account={{
          id: 1,
          bank_name: 'B',
          account_name: 'N',
          account_number: '1',
          qr_code_url: null,
        }}
        onClose={onClose}
        onSaved={() => {}}
      />,
    );
    expect(
      screen.getByRole('dialog', { name: 'Edit bank account' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    fail(new ServiceError('Duplicate account', 409));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Duplicate account',
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});
