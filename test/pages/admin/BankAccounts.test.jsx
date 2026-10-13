import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import { ServiceError } from '../../../src/services/http.js';
import * as getBankAccountsModule from '../../../src/services/getBankAccounts.js';
import { signInAdmin, signOutAdmin } from '../../helpers/adminAuth.js';

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/admin/bank-accounts']}>
      <App />
    </MemoryRouter>,
  );
}

describe('admin bank accounts page', () => {
  beforeEach(async () => {
    await signInAdmin();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('lists accounts read-only with QR links', async () => {
    renderPage();
    expect(await screen.findByText('Sample Bank')).toBeInTheDocument();
    expect(
      screen.getByText(/managed by the provider for now/),
    ).toBeInTheDocument();
    expect(screen.getByText('0011-2233-4455')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'View Sample Bank QR code' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(
      screen.getAllByRole('img', { name: 'Omar Bank QR code' }),
    ).toHaveLength(1);
    expect(
      screen.queryByRole('button', { name: /add|edit/i }),
    ).not.toBeInTheDocument();
  });

  it('shows a dash when there is no QR code', async () => {
    vi.spyOn(getBankAccountsModule, 'getBankAccounts').mockResolvedValue([
      {
        id: 1,
        bank_name: 'B',
        account_name: 'N',
        account_number: '1',
        qr_code_url: null,
      },
    ]);
    renderPage();
    expect(await screen.findByText('—')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /QR code/ })).not.toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    vi.spyOn(getBankAccountsModule, 'getBankAccounts').mockResolvedValue([]);
    renderPage();
    expect(
      await screen.findByText('No bank accounts yet.'),
    ).toBeInTheDocument();
  });

  it('shows the load error and hides the table', async () => {
    vi.spyOn(getBankAccountsModule, 'getBankAccounts').mockRejectedValue(
      new ServiceError('Nope', 500),
    );
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Nope');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('does not fetch for accounting users', async () => {
    await signInAdmin('accounting');
    const spy = vi.spyOn(getBankAccountsModule, 'getBankAccounts');
    renderPage();
    expect(
      await screen.findByText('Only admins can view bank accounts.'),
    ).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
});
