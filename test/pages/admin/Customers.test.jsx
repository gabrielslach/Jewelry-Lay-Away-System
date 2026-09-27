import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import * as getAdminCustomerModule from '../../../src/services/getAdminCustomer.js';
import * as getAdminCustomersModule from '../../../src/services/getAdminCustomers.js';

describe('admin customers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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

  it('shows spec skeleton bones in the detail modal while the customer loads', async () => {
    const realGetAdminCustomer = getAdminCustomerModule.getAdminCustomer;
    let resolve;
    vi.spyOn(getAdminCustomerModule, 'getAdminCustomer').mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    render(
      <MemoryRouter initialEntries={['/admin/customers']}>
        <App />
      </MemoryRouter>,
    );
    const shopperRow = (await screen.findByText('Sample Shopper')).closest('tr');
    fireEvent.click(within(shopperRow).getByRole('button', { name: 'View' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sample Shopper' })).toBeInTheDocument();
    expect(document.querySelector('.modal-body .skeleton[aria-busy="true"]')).toBeInTheDocument();
    expect(document.querySelectorAll('.modal-body .spec-item .skeleton-bone')).toHaveLength(8);
    expect(screen.queryByText(/900 000/)).not.toBeInTheDocument();
    resolve(await realGetAdminCustomer(5));
    expect(await screen.findByText(/900 000/)).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('.modal-body .skeleton[aria-busy="true"]')).not.toBeInTheDocument();
    });
  });

  it('opens customer detail', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/customers']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Sample Shopper')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);
    expect(await screen.findByText(/900 000/)).toBeInTheDocument();
  });
});
