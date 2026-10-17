import { MemoryRouter } from 'react-router-dom';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import { ServiceError } from '../../../src/services/http.js';
import * as bankAccountsModule from '../../../src/services/adminBankAccounts.js';
import { signInAdmin, signOutAdmin } from '../../helpers/adminAuth.js';

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/admin/bank-accounts']}>
      <App />
    </MemoryRouter>,
  );
}

const account = (overrides = {}) => ({
  id: 1,
  bank_name: 'Sample Bank',
  account_name: 'AlMar Corp',
  account_number: '0011-2233-4455',
  qr_code_url: '/placeholders/1.svg',
  is_active: true,
  ...overrides,
});

describe.each(['admin', 'accounting'])(
  'admin bank accounts page as %s',
  (role) => {
    beforeEach(async () => {
      await signInAdmin(role);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      signOutAdmin();
    });

    it('lists every account with QR thumbnail and status', async () => {
      vi.spyOn(bankAccountsModule, 'getAdminBankAccounts').mockResolvedValue([
        account(),
        account({
          id: 2,
          bank_name: 'Bank AZ',
          account_number: '9-9',
          qr_code_url: null,
          is_active: false,
        }),
      ]);
      renderPage();
      expect(await screen.findByText('Sample Bank')).toBeInTheDocument();
      expect(screen.getByText('0011-2233-4455')).toBeInTheDocument();
      const link = screen.getByRole('link', {
        name: 'View Sample Bank QR code',
      });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getAllByText('—')).toHaveLength(1);
    });

    it('shows the load error with a retry', async () => {
      const list = vi
        .spyOn(bankAccountsModule, 'getAdminBankAccounts')
        .mockRejectedValueOnce(new ServiceError('Nope', 500))
        .mockResolvedValue([account()]);
      renderPage();
      expect(await screen.findByRole('alert')).toHaveTextContent('Nope');
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(await screen.findByText('Sample Bank')).toBeInTheDocument();
      expect(list).toHaveBeenCalledTimes(2);
    });
  },
);

describe('admin bank accounts page as admin', () => {
  beforeEach(async () => {
    await signInAdmin();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('shows the admin copy, the add button and row actions', async () => {
    renderPage();
    expect(await screen.findByText('Sample Bank')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Accounts customers pay into. Only active accounts are shown at checkout.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add bank account' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit Sample Bank' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Deactivate Sample Bank' }),
    ).toBeInTheDocument();
  });

  it('shows the empty state with the add button', async () => {
    vi.spyOn(bankAccountsModule, 'getAdminBankAccounts').mockResolvedValue([]);
    renderPage();
    expect(
      await screen.findByText(
        'No bank accounts yet. Add one so customers can pay.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add bank account' }),
    ).toBeInTheDocument();
  });

  it('adds an account and refreshes the list', async () => {
    renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Add bank account' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Add bank account',
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(
      within(dialog).getByText('Enter the bank name.'),
    ).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Bank name'), {
      target: { value: 'New Bank' },
    });
    fireEvent.change(within(dialog).getByLabelText('Account name'), {
      target: { value: 'AlMar' },
    });
    fireEvent.change(within(dialog).getByLabelText('Account number'), {
      target: { value: '99-88' },
    });
    expect(
      within(dialog).getByText('PNG or JPG. Optional.'),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('New Bank')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the form, values and chosen QR open when the server rejects the save', async () => {
    vi.spyOn(bankAccountsModule, 'createAdminBankAccount').mockRejectedValue(
      new ServiceError('Invalid bank account', 400, {
        bank_name: 'Bank name is too long',
        qr_code: 'QR must be an image',
      }),
    );
    renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Add bank account' }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Bank name'), {
      target: { value: 'New Bank' },
    });
    fireEvent.change(within(dialog).getByLabelText('Account name'), {
      target: { value: 'AlMar' },
    });
    fireEvent.change(within(dialog).getByLabelText('Account number'), {
      target: { value: '1' },
    });
    fireEvent.change(within(dialog).getByLabelText('QR code'), {
      target: { files: [new File(['x'], 'qr.png', { type: 'image/png' })] },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(
      await within(dialog).findByText('Bank name is too long'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('Invalid bank account'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('QR must be an image')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Bank name')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(within(dialog).getByLabelText('Bank name')).toHaveValue('New Bank');
    expect(
      within(dialog).getByRole('img', { name: 'QR code preview' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled();

    fireEvent.change(within(dialog).getByLabelText('Bank name'), {
      target: { value: 'Short' },
    });
    expect(
      within(dialog).queryByText('Bank name is too long'),
    ).not.toBeInTheDocument();
  });

  it('edits an account, shows its QR and can remove it', async () => {
    const update = vi.spyOn(bankAccountsModule, 'updateAdminBankAccount');
    renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit Sample Bank' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Edit bank account',
    });
    expect(within(dialog).getByLabelText('Bank name')).toHaveValue(
      'Sample Bank',
    );
    expect(
      within(dialog).getByRole('img', { name: 'QR code preview' }),
    ).toHaveAttribute('src', '/placeholders/1.svg');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remove QR' }));
    expect(
      within(dialog).queryByRole('img', { name: 'QR code preview' }),
    ).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ bank_name: 'Sample Bank', removeQr: true }),
    );
    expect(
      screen.queryByRole('link', { name: 'View Sample Bank QR code' }),
    ).not.toBeInTheDocument();
  });

  it('replaces the preview when a new file is chosen and cancels removal', async () => {
    const update = vi.spyOn(bankAccountsModule, 'updateAdminBankAccount');
    renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit Sample Bank' }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remove QR' }));
    const file = new File(['x'], 'qr.png', { type: 'image/png' });
    fireEvent.change(within(dialog).getByLabelText('QR code'), {
      target: { files: [file] },
    });
    expect(
      within(dialog)
        .getByRole('img', { name: 'QR code preview' })
        .getAttribute('src'),
    ).toMatch(/^blob:/);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][1]).toMatchObject({
      qrFile: file,
      removeQr: false,
    });
  });

  it('confirms before deactivating and activates without a prompt', async () => {
    renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Deactivate Sample Bank' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Deactivate this account?',
    });
    expect(
      within(dialog).getByText(
        'Customers will no longer see Sample Bank when paying. You can activate it again later.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Deactivate' }));
    const activate = await screen.findByRole('button', {
      name: 'Activate Sample Bank',
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(activate);
    expect(
      await screen.findByRole('button', { name: 'Deactivate Sample Bank' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the server message when the last active account cannot be deactivated', async () => {
    renderPage();
    await screen.findByText('Sample Bank');
    fireEvent.click(
      screen.getByRole('button', { name: 'Deactivate Bank AZ' }),
    );
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Deactivate',
      }),
    );
    await screen.findByRole('button', { name: 'Activate Bank AZ' });
    fireEvent.click(
      screen.getByRole('button', { name: 'Deactivate Sample Bank' }),
    );
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Deactivate',
      }),
    );
    expect(
      await within(screen.getByRole('dialog')).findByText(
        'At least one bank account must stay active',
      ),
    ).toBeInTheDocument();
  });
});

describe('admin bank accounts page as accounting', () => {
  beforeEach(async () => {
    await signInAdmin('accounting');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('is read-only', async () => {
    renderPage();
    expect(await screen.findByText('Sample Bank')).toBeInTheDocument();
    expect(
      screen.getByText('Accounts customers pay into. View only.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /add|edit|activate/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Actions' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
  });

  it('shows the short empty state', async () => {
    vi.spyOn(bankAccountsModule, 'getAdminBankAccounts').mockResolvedValue([]);
    renderPage();
    expect(
      await screen.findByText('No bank accounts yet.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add bank account' }),
    ).not.toBeInTheDocument();
  });
});
