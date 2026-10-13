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
import { signInAdmin, signOutAdmin } from '../../helpers/adminAuth.js';
import * as getAdminPlansModule from '../../../src/services/getAdminPlans.js';
import * as getLayawayPlanModule from '../../../src/services/getLayawayPlan.js';
import * as adminReservationsModule from '../../../src/services/adminReservations.js';
import { ServiceError } from '../../../src/services/http.js';

describe('admin orders', () => {
  beforeEach(async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
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
    expect(
      document.querySelector('.skeleton[aria-busy="true"]'),
    ).toBeInTheDocument();
    expect(document.querySelectorAll('.skeleton-table-row')).toHaveLength(5);
    expect(screen.queryByText('LA-1001')).not.toBeInTheDocument();
    resolve(await realGetAdminPlans());
    expect(await screen.findByText('LA-1001')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        document.querySelector('.skeleton[aria-busy="true"]'),
      ).not.toBeInTheDocument();
    });
  });

  it('filters overdue plans and opens detail with reservation status', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('LA-1001')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Show Overdue orders' }),
    );
    expect(await screen.findByText('LA-1002')).toBeInTheDocument();
    expect(screen.queryByText('LA-1001')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);
    const dialog = await screen.findByRole('dialog');
    const statusItem = within(dialog).getByText('Status').closest('.spec-item');
    expect(within(statusItem).getByText('Overdue')).toBeInTheDocument();
    const reservationItem = within(dialog)
      .getByText('Reservation')
      .closest('.spec-item');
    expect(within(reservationItem).getByText('Reserved')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Cancel reservation' }),
    ).toBeInTheDocument();
  });

  it('hides Retry and Cancel reservation for accounting', async () => {
    await signInAdmin('accounting');
    const [plan] = await getAdminPlansModule.getAdminPlans();
    vi.spyOn(getAdminPlansModule, 'getAdminPlans').mockResolvedValue([
      { ...plan, reservation_status: 'waiting_for_stock' },
    ]);
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'View' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByRole('button', { name: 'Close' })).toHaveLength(2);
    expect(within(dialog).queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: 'Cancel reservation' }),
    ).not.toBeInTheDocument();
  });

  it('shows dashes for closed-plan next due and missing reservation, None badge otherwise', async () => {
    vi.spyOn(getAdminPlansModule, 'getAdminPlans').mockResolvedValue([
      { id: 'LA-1', customer_name: 'Ana', status: 'defaulted', next_due: 'Nov 1', reservation_status: 'none' },
      { id: 'LA-2', customer_name: 'Ben', total_price: 100, status: 'active', next_due: '', reservation_status: undefined },
      { id: 'LA-3', customer_name: 'Cy', status: 'active', next_due: 'Dec 5', reservation_status: 'reserved' },
    ]);
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    const rowOf = async (id) => (await screen.findByText(id)).closest('tr');
    const closed = await rowOf('LA-1');
    expect(within(closed).queryByText('Nov 1')).not.toBeInTheDocument();
    expect(within(closed).getByText('None')).toHaveClass('badge-mute');
    const noDue = await rowOf('LA-2');
    expect(within(noDue).getAllByText('—')).toHaveLength(2);
    expect(within(await rowOf('LA-3')).getByText('Dec 5')).toBeInTheDocument();
  });

  it('lists active plans under All and On Track without an Active filter', async () => {
    vi.spyOn(getAdminPlansModule, 'getAdminPlans').mockResolvedValue([
      {
        id: 'LA-72',
        customer_name: 'Ana',
        item_name: 'Ring',
        status: 'active',
      },
      {
        id: 'LA-73',
        customer_name: 'Ben',
        item_name: 'Chain',
        status: 'overdue',
      },
    ]);
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('LA-72')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show Active orders' }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Show On Track orders' }),
    );
    expect(screen.getByText('LA-72')).toBeInTheDocument();
    expect(screen.queryByText('LA-73')).not.toBeInTheDocument();
  });

  it('offers a filter per plan status', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText('LA-1001');
    const labels = [
      'All',
      'On Track',
      'Overdue',
      'Completed',
      'Cancelled',
      'Defaulted',
    ];
    labels.forEach((label) => {
      expect(
        screen.getByRole('button', {
          name: label === 'All' ? 'Show All orders' : `Show ${label} orders`,
        }),
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Show Defaulted orders' }),
    );
    expect(screen.queryByText('LA-1001')).not.toBeInTheDocument();
  });

  it('shows total in the table and plan money details in the modal', async () => {
    vi.spyOn(getAdminPlansModule, 'getAdminPlans').mockResolvedValue([
      {
        id: 'LA-7',
        customer_name: 'Ana',
        item_name: 'Ring',
        status: 'defaulted',
        created_at: '2026-03-04T00:00:00.000Z',
        total_price: 12000,
        down_payment_amount: 3600,
        installments: [],
      },
      {
        id: 'LA-8',
        customer_name: 'Ben',
        item_name: 'Pendant',
        status: 'cancelled',
      },
    ]);
    vi.spyOn(getLayawayPlanModule, 'getLayawayPlan').mockResolvedValue({
      installments: [
        { id: 'a', amount: 4200, status: 'pending' },
        { id: 'b', amount: 4200, status: 'pending' },
        { id: 'c', amount: 999, status: 'superseded' },
      ],
    });
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText('LA-7');
    expect(
      screen.getByRole('columnheader', { name: /^Total/ }),
    ).toBeInTheDocument();
    const table = within(screen.getByRole('table'));
    expect(table.getByText('Defaulted')).toHaveClass('badge-warn');
    expect(table.getByText('Cancelled')).toHaveClass('badge-mute');
    expect(table.getByText('₱12,000')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);
    const dialog = await screen.findByRole('dialog');
    const item = (label) =>
      within(dialog).getByText(label).closest('.spec-item');
    expect(
      within(item('Created')).getByText('Mar 4, 2026'),
    ).toBeInTheDocument();
    expect(
      within(item('Total amount')).getByText('₱12,000'),
    ).toBeInTheDocument();
    expect(
      within(item('Financed amount')).getByText('₱8,400'),
    ).toBeInTheDocument();
    expect(
      within(item('Down payment')).getByText('₱3,600'),
    ).toBeInTheDocument();
  });

  it('shows a dash for missing plan amounts', async () => {
    vi.spyOn(getAdminPlansModule, 'getAdminPlans').mockResolvedValue([
      {
        id: 'LA-8',
        customer_name: 'Ben',
        item_name: 'Pendant',
        status: 'on_track',
      },
    ]);
    vi.spyOn(getLayawayPlanModule, 'getLayawayPlan').mockResolvedValue({
      installments: [],
    });
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText('LA-8');
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('Total amount').closest('.spec-item'),
    ).toHaveTextContent('—');
    expect(dialog).not.toHaveTextContent('NaN');
  });

  it('fetches plan detail on View and shows its installments', async () => {
    const spy = vi
      .spyOn(getLayawayPlanModule, 'getLayawayPlan')
      .mockResolvedValue({
        id: 'LA-1001',
        status: 'completed',
        installments: [
          { id: 'a', term_number: 1, amount: 111, status: 'paid' },
          { id: 'b', term_number: 2, amount: 222, status: 'pending' },
        ],
      });
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText('LA-1001');
    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);
    const dialog = await screen.findByRole('dialog');
    expect(spy).toHaveBeenCalledWith('LA-1001');
    expect(within(dialog).getByText('Payment 1 of 2')).toBeInTheDocument();
    expect(within(dialog).getByText('₱222')).toBeInTheDocument();
    const statusItem = within(dialog).getByText('Status').closest('.spec-item');
    expect(within(statusItem).getByText('On Track')).toBeInTheDocument();
  });

  it('shows an error and no dialog when the detail fetch fails', async () => {
    vi.spyOn(getLayawayPlanModule, 'getLayawayPlan').mockRejectedValue(
      new ServiceError('Plan not found', 404),
    );
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText('LA-1001');
    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);
    expect(await screen.findByText('Plan not found')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the ?plan= deep link with fetched installments', async () => {
    vi.spyOn(getLayawayPlanModule, 'getLayawayPlan').mockResolvedValue({
      installments: [{ id: 'a', term_number: 1, amount: 333, status: 'paid' }],
    });
    render(
      <MemoryRouter initialEntries={['/admin/orders?plan=LA-1001']}>
        <App />
      </MemoryRouter>,
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByText('₱333').length).toBeGreaterThan(0);
  });

  it('still lists orders when the deep-link detail fetch fails', async () => {
    vi.spyOn(getLayawayPlanModule, 'getLayawayPlan').mockRejectedValue(
      new ServiceError('Plan not found', 404),
    );
    render(
      <MemoryRouter initialEntries={['/admin/orders?plan=LA-1001']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Plan not found')).toBeInTheDocument();
    expect(screen.getByText('LA-1001')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps detail installments in the modal after Retry refreshes the list', async () => {
    const [plan] = await getAdminPlansModule.getAdminPlans();
    vi.spyOn(getAdminPlansModule, 'getAdminPlans').mockResolvedValue([
      { ...plan, reservation_status: 'waiting_for_stock', installments: [] },
    ]);
    vi.spyOn(adminReservationsModule, 'retryReservation').mockResolvedValue({});
    vi.spyOn(getLayawayPlanModule, 'getLayawayPlan').mockResolvedValue({
      installments: [
        { id: 'a', term_number: 1, amount: 444, status: 'pending' },
      ],
    });
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText(plan.id);
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Retry' }));
    await waitFor(() => {
      expect(getLayawayPlanModule.getLayawayPlan).toHaveBeenCalledTimes(2);
    });
    expect(
      within(await screen.findByRole('dialog')).getAllByText('₱444').length,
    ).toBeGreaterThan(0);
  });

  it('sorts order ids by number and next due by date with empty dates last', async () => {
    vi.spyOn(getAdminPlansModule, 'getAdminPlans').mockResolvedValue([
      { id: 'LA-10', customer_name: 'Ana', next_due: 'Nov 1', next_due_date: '2026-11-01' },
      { id: 'LA-7', customer_name: 'Ben', next_due: '', next_due_date: null },
      { id: 'LA-9', customer_name: 'Cy', next_due: 'Jan 5', next_due_date: '2027-01-05' },
      { id: 'LA-8', customer_name: 'Di', next_due: 'Oct 2', next_due_date: '2026-10-02' },
    ]);
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText('LA-10');
    const orderIds = () =>
      screen
        .getAllByRole('row')
        .slice(1)
        .map((row) => within(row).getAllByRole('cell')[0].textContent);

    fireEvent.click(
      within(screen.getByRole('columnheader', { name: /^Order/ })).getByRole('button'),
    );
    expect(orderIds()).toEqual(['LA-7', 'LA-8', 'LA-9', 'LA-10']);

    const nextDue = within(screen.getByRole('columnheader', { name: /^Next Due/ }));
    fireEvent.click(nextDue.getByRole('button'));
    expect(orderIds()).toEqual(['LA-8', 'LA-10', 'LA-9', 'LA-7']);
    fireEvent.click(nextDue.getByRole('button'));
    expect(orderIds()).toEqual(['LA-9', 'LA-10', 'LA-8', 'LA-7']);
  });
});
