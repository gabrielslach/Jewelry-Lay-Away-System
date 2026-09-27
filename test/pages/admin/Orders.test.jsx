import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import * as getAdminPlansModule from '../../../src/services/getAdminPlans.js';

describe('admin orders', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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

  it('keeps the orders table visible while refreshing after mark paid', async () => {
    const realGetAdminPlans = getAdminPlansModule.getAdminPlans;
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('LA-1001')).toBeInTheDocument();
    let resolveRefresh;
    vi.spyOn(getAdminPlansModule, 'getAdminPlans').mockReturnValue(
      new Promise((done) => {
        resolveRefresh = done;
      }),
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Mark Next Payment Received' }));
    await waitFor(() => {
      expect(resolveRefresh).toEqual(expect.any(Function));
    });
    expect(document.querySelector('.skeleton[aria-busy="true"]')).not.toBeInTheDocument();
    expect(screen.getByText('LA-1001')).toBeInTheDocument();
    resolveRefresh(await realGetAdminPlans());
    expect(await screen.findByText('Payment marked as received for LA-1001.')).toBeInTheDocument();
  });

  it('filters overdue plans and opens detail', async () => {
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
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
