import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import { signInAdmin, signOutAdmin } from '../../helpers/adminAuth.js';
import * as getAdminPlansModule from '../../../src/services/getAdminPlans.js';

describe('admin orders', () => {
  beforeEach(async () => {
    await signInAdmin();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('shows skeleton table rows until plans load', async () => {
    const realGetAdminPlans = getAdminPlansModule.getAdminPlans;
    let resolve;
    vi.spyOn(getAdminPlansModule, 'getAdminPlans').mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    expect(document.querySelector('.skeleton[aria-busy="true"]')).toBeInTheDocument();
    expect(document.querySelectorAll('.skeleton-table-row')).toHaveLength(5);
    expect(screen.queryByText('LA-1001')).not.toBeInTheDocument();
    resolve(await realGetAdminPlans());
    expect(await screen.findByText('LA-1001')).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('.skeleton[aria-busy="true"]')).not.toBeInTheDocument();
    });
  });

  it('filters overdue plans and opens detail with reservation status', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('LA-1001')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show Overdue orders' }));
    expect(await screen.findByText('LA-1002')).toBeInTheDocument();
    expect(screen.queryByText('LA-1001')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Reserved')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cancel reservation' })).toBeInTheDocument();
  });
});
