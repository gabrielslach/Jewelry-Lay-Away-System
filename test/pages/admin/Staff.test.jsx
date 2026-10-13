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
import * as getStaffModule from '../../../src/services/getAdminStaff.js';
import { signInAdmin, signOutAdmin } from '../../helpers/adminAuth.js';

function renderStaff() {
  render(
    <MemoryRouter initialEntries={['/admin/staff']}>
      <App />
    </MemoryRouter>,
  );
}

describe('admin staff page', () => {
  beforeEach(async () => {
    await signInAdmin();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('lists staff with usage, role labels, status and (you)', async () => {
    renderStaff();
    expect(await screen.findByText('Sample Accountant')).toBeInTheDocument();
    expect(
      screen.getByText('Admins 1 of 2 · Accounting 1 of 3'),
    ).toBeInTheDocument();
    const adminRow = screen
      .getByText('Sample Admin', { selector: 'b' })
      .closest('tr');
    expect(within(adminRow).getByText('(you)')).toBeInTheDocument();
    expect(within(adminRow).getByText('Admin')).toBeInTheDocument();
    expect(within(adminRow).getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText('accounting')).not.toBeInTheDocument();
  });

  it('shows a skeleton while loading', async () => {
    let resolve;
    vi.spyOn(getStaffModule, 'getAdminStaff').mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    renderStaff();
    expect(document.querySelectorAll('.skeleton-table-row')).toHaveLength(5);
    resolve([]);
    expect(await screen.findByText('No staff yet.')).toBeInTheDocument();
  });

  it('shows the load error and hides the table', async () => {
    vi.spyOn(getStaffModule, 'getAdminStaff').mockRejectedValue(
      new ServiceError('Boom', 500),
    );
    renderStaff();
    expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('adds staff, toasts and refetches', async () => {
    renderStaff();
    await screen.findByText('Sample Accountant');
    fireEvent.click(screen.getByRole('button', { name: 'Add staff' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Ann Lee' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ann@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'longenough' },
    });
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Add staff',
      }),
    );
    expect(await screen.findByText('Staff added.')).toBeInTheDocument();
    expect(await screen.findByText('Ann Lee')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('edits staff, toasts and refetches', async () => {
    renderStaff();
    await screen.findByText('Sample Accountant');
    fireEvent.click(
      screen.getByRole('button', { name: 'Edit Sample Accountant' }),
    );
    fireEvent.click(screen.getByRole('switch', { name: 'Active' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Staff updated.')).toBeInTheDocument();
    expect(await screen.findByText('Inactive')).toBeInTheDocument();
  });

  it('locks role and active on the signed-in admin row', async () => {
    renderStaff();
    await screen.findByText('Sample Accountant');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Sample Admin' }));
    expect(screen.getByLabelText('Role')).toBeDisabled();
    expect(screen.getByText(/can't change your own role/)).toBeInTheDocument();
  });

  it('keeps the signed-in session name in step after renaming yourself', async () => {
    renderStaff();
    await screen.findByText('Sample Accountant');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Sample Admin' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Boss' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(screen.getByText('Staff updated.')).toBeInTheDocument(),
    );
    expect(JSON.parse(localStorage.getItem('admin')).name).toBe('Boss');
  });

  it('does not render or fetch for accounting users', async () => {
    await signInAdmin('accounting');
    const spy = vi.spyOn(getStaffModule, 'getAdminStaff');
    renderStaff();
    expect(
      await screen.findByText('Only admins can manage staff.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add staff' }),
    ).not.toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
});
