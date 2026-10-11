import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import { signInAdmin, signOutAdmin } from '../../helpers/adminAuth.js';
import * as getAdminDashboardModule from '../../../src/services/getAdminDashboard.js';

describe('admin dashboard', () => {
  beforeEach(async () => {
    await signInAdmin();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('shows KPI, chart, and activity skeleton bones until the dashboard loads', async () => {
    const realGetAdminDashboard = getAdminDashboardModule.getAdminDashboard;
    let resolve;
    vi.spyOn(getAdminDashboardModule, 'getAdminDashboard').mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    );
    expect(document.querySelector('.skeleton[aria-busy="true"]')).toBeInTheDocument();
    expect(document.querySelectorAll('.kpi-row .kpi-card')).toHaveLength(4);
    expect(document.querySelectorAll('.bar-chart .skeleton-bone-bar')).toHaveLength(6);
    expect(document.querySelectorAll('.activity-item .skeleton-bone')).toHaveLength(6);
    expect(document.querySelectorAll('.bar-chart .bar')).toHaveLength(0);
    resolve(await realGetAdminDashboard());
    await waitFor(() => {
      expect(document.querySelectorAll('.bar-chart .bar').length).toBeGreaterThan(0);
    });
    expect(document.querySelector('.skeleton[aria-busy="true"]')).not.toBeInTheDocument();
  });

  it('sets bar heights for the collections chart', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(document.querySelectorAll('.bar-chart .bar').length).toBeGreaterThan(0);
    });
    const bars = document.querySelectorAll('.bar-chart .bar');
    bars.forEach((bar) => {
      expect(bar.style.height).toMatch(/%$/);
    });
  });

  it('labels each week with its exact total and compact amount', async () => {
    vi.spyOn(getAdminDashboardModule, 'getAdminDashboard').mockResolvedValue({
      active_layaways: 1,
      collected_this_month: 0,
      overdue_payments: 0,
      active_customers: 1,
      collections_last_6_weeks: [
        { week_start: '2026-09-13', total: 0, height: 0 },
        { week_start: '2026-09-20', total: 12500, height: 100 },
      ],
      recent_activity: [],
    });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    );

    const items = await screen.findAllByRole('listitem', { name: /^Week of/ });
    expect(items.map((item) => item.getAttribute('aria-label'))).toEqual([
      'Week of Sep 13: ₱0.00',
      'Week of Sep 20: ₱12,500.00',
    ]);
    expect(items[1]).toHaveTextContent('₱12.5kWk 2');
  });

  it('keeps activity title and detail on separate lines', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(document.querySelector('.activity-item b')).toBeTruthy();
    });
    const item = document.querySelector('.activity-item');
    const title = item.querySelector('b');
    const detail = item.querySelector('span');
    expect(title).toBeTruthy();
    expect(detail).toBeTruthy();
    expect(title.nextElementSibling).toBe(detail);
    expect(title.textContent).not.toContain(detail.textContent);
  });

  it('renders live-shaped activity labels as bold titles', async () => {
    vi.spyOn(getAdminDashboardModule, 'getAdminDashboard').mockResolvedValue({
      active_layaways: 1,
      collected_this_month: 37400,
      overdue_payments: 0,
      active_customers: 1,
      collections_last_6_weeks: [],
      recent_activity: [
        {
          title: 'New reservation',
          detail: 'Rounding Test - plan #8 · Sep 26, 10:02 AM',
          key: 'New reservation|Rounding Test - plan #8|2026-09-26T02:02:10.000Z|0',
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(document.querySelector('.activity-item b')?.textContent).toBe('New reservation');
    });
    const item = document.querySelector('.activity-item');
    expect(item.querySelector('b').textContent).toBe('New reservation');
    expect(item.querySelector('span').textContent).toContain('Rounding Test - plan #8');
    expect(item.querySelector('b').textContent.trim()).not.toBe('');
  });
});
