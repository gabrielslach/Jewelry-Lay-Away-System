import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import { signInAdmin, signOutAdmin } from '../../helpers/adminAuth.js';
import * as deleteModule from '../../../src/services/deleteAdminCustomerSessions.js';
import * as getAdminCustomersModule from '../../../src/services/getAdminCustomers.js';

describe('admin customers', () => {
  beforeEach(async () => {
    await signInAdmin();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('shows customer table skeleton rows until the list loads', async () => {
    const realGetAdminCustomers = getAdminCustomersModule.getAdminCustomers;
    let resolve;
    vi.spyOn(getAdminCustomersModule, 'getAdminCustomers').mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(
      <MemoryRouter initialEntries={['/admin/customers']}>
        <App />
      </MemoryRouter>,
    );
    expect(document.querySelector('.skeleton[aria-busy="true"]')).toBeInTheDocument();
    expect(document.querySelectorAll('.skeleton-table-row')).toHaveLength(5);
    expect(screen.queryByText('Sample Shopper')).not.toBeInTheDocument();
    resolve(await realGetAdminCustomers());
    expect(await screen.findByText('Sample Shopper')).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('.skeleton[aria-busy="true"]')).not.toBeInTheDocument();
    });
  });

  function renderCustomers() {
    render(
      <MemoryRouter initialEntries={['/admin/customers']}>
        <App />
      </MemoryRouter>,
    );
  }

  async function openConfirm() {
    renderCustomers();
    await screen.findByText('Sample Shopper');
    fireEvent.click(screen.getByRole('button', { name: 'Delete sessions for Sample Shopper' }));
    return screen.findByRole('dialog');
  }

  it('shows phone, formatted member since and dashes for missing values', async () => {
    vi.spyOn(getAdminCustomersModule, 'getAdminCustomers').mockResolvedValue([
      { id: 1, name: 'Ana', email: 'a@x.com', phone: '+63 900 111 2222', member_since: '2026-10-11', active_layaway_count: 1 },
      { id: 2, name: 'Ben', email: 'b@x.com', phone: null, member_since: 'not a date', active_layaway_count: 0 },
    ]);
    renderCustomers();
    const ana = (await screen.findByText('Ana')).closest('tr');
    expect(screen.getByRole('columnheader', { name: 'Phone' })).toBeInTheDocument();
    expect(within(ana).getByText('+63 900 111 2222')).toBeInTheDocument();
    expect(within(ana).getByText('Oct 11, 2026')).toBeInTheDocument();
    const ben = screen.getByText('Ben').closest('tr');
    expect(within(ben).getAllByText('—')).toHaveLength(2);
    expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument();
  });

  it('cancels the confirmation without calling the service', async () => {
    const spy = vi.spyOn(deleteModule, 'deleteAdminCustomerSessions');
    const dialog = await openConfirm();
    expect(within(dialog).getByRole('heading', { name: 'Delete sessions?' })).toBeInTheDocument();
    expect(within(dialog).getByText(/Sample Shopper will be signed out on all devices/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('deletes sessions, closes the modal and shows a toast', async () => {
    const spy = vi.spyOn(deleteModule, 'deleteAdminCustomerSessions').mockResolvedValue({});
    const dialog = await openConfirm();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete sessions' }));
    expect(await screen.findByText('Signed Sample Shopper out of all devices.')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith(5);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Sample Shopper')).toBeInTheDocument();
  });

  it('blocks closing while deleting', async () => {
    let resolve;
    vi.spyOn(deleteModule, 'deleteAdminCustomerSessions').mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const dialog = await openConfirm();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete sessions' }));
    expect(await within(dialog).findByRole('button', { name: 'Deleting…' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    resolve({});
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the modal open and shows an error when deleting fails', async () => {
    vi.spyOn(deleteModule, 'deleteAdminCustomerSessions').mockRejectedValue(new Error('boom'));
    const dialog = await openConfirm();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete sessions' }));
    expect(await within(dialog).findByText('Unable to delete sessions.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Delete sessions' })).toBeEnabled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete sessions for Sample Shopper' }));
    expect(screen.queryByText('Unable to delete sessions.')).not.toBeInTheDocument();
  });
});
