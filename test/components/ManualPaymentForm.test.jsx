import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ManualPaymentForm from '../../src/components/ManualPaymentForm.jsx';
import { ToastProvider } from '../../src/components/ToastProvider.jsx';
import * as bankAccounts from '../../src/services/getBankAccounts.js';
import * as submitManualPayment from '../../src/services/submitManualPayment.js';

function renderForm(props = {}) {
  return render(
    <ToastProvider>
      <ManualPaymentForm
        planId="LA-1"
        kind="down_payment"
        expectedAmount={12000}
        onCancel={() => {}}
        onSuccess={() => {}}
        {...props}
      />
    </ToastProvider>,
  );
}

describe('ManualPaymentForm', () => {
  it('auto-selects a single bank account, shows details, and submits', async () => {
    vi.spyOn(bankAccounts, 'getBankAccounts').mockResolvedValue([
      {
        id: 1,
        bank_name: 'Sample Bank',
        account_name: 'AlMar Corp',
        account_number: '0011-2233-4455',
        qr_code_url: '/placeholders/1.svg',
      },
    ]);
    const submit = vi
      .spyOn(submitManualPayment, 'submitDownPaymentManual')
      .mockResolvedValue({ id: 9, status: 'submitted' });
    const onSuccess = vi.fn();
    renderForm({ onSuccess });

    expect(
      await screen.findByText(/Step 1: transfer ₱12,000.00 to one of our accounts/),
    ).toBeInTheDocument();
    const bankSelect = await screen.findByLabelText('Transfer to');
    expect(bankSelect).toHaveValue('1');
    expect(screen.getByText('Account name: AlMar Corp')).toBeInTheDocument();
    expect(screen.getByText('Account no.: 0011-2233-4455')).toBeInTheDocument();
    expect(document.querySelector('.bank-account-qr')).toHaveAttribute(
      'src',
      '/placeholders/1.svg',
    );
    fireEvent.change(screen.getByLabelText('Reference number'), {
      target: { value: 'BT-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit payment' }));
    await waitFor(() => {
      expect(submit).toHaveBeenCalled();
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(screen.getByText('Payment submitted - awaiting confirmation.')).toBeInTheDocument();
  });

  it('default-selects the first bank and updates details when switching', async () => {
    vi.spyOn(bankAccounts, 'getBankAccounts').mockResolvedValue([
      {
        id: 1,
        bank_name: 'Sample Bank',
        account_name: 'AlMar Corp',
        account_number: '0011-2233-4455',
        qr_code_url: '/placeholders/1.svg',
      },
      {
        id: 2,
        bank_name: 'Other Bank',
        account_name: 'AlMar Other',
        account_number: '9999',
        qr_code_url: '/placeholders/2.svg',
      },
    ]);
    renderForm();

    const bankSelect = await screen.findByLabelText('Transfer to');
    expect(bankSelect).toHaveValue('1');
    expect(screen.queryByRole('option', { name: 'Select bank' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Sample Bank' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Other Bank' })).toBeInTheDocument();
    expect(screen.getByText('Account name: AlMar Corp')).toBeInTheDocument();
    expect(screen.getByText('Account no.: 0011-2233-4455')).toBeInTheDocument();
    expect(document.querySelector('.bank-account-qr')).toHaveAttribute(
      'src',
      '/placeholders/1.svg',
    );

    fireEvent.change(bankSelect, { target: { value: '2' } });
    expect(screen.getByText('Account name: AlMar Other')).toBeInTheDocument();
    expect(screen.getByText('Account no.: 9999')).toBeInTheDocument();
    expect(document.querySelector('.bank-account-qr')).toHaveAttribute(
      'src',
      '/placeholders/2.svg',
    );
  });

  it('shows inline validation when no banks are available', async () => {
    vi.spyOn(bankAccounts, 'getBankAccounts').mockResolvedValue([]);
    renderForm();
    const bankSelect = await screen.findByLabelText('Transfer to');
    expect(bankSelect).toBeDisabled();
    expect(screen.getByRole('option', { name: 'No banks available' })).toBeInTheDocument();
    expect(screen.queryByText(/Account name:/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Reference number'), {
      target: { value: 'BT-2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit payment' }));
    expect(await screen.findByText('Please choose a bank account.')).toBeInTheDocument();
  });
});
