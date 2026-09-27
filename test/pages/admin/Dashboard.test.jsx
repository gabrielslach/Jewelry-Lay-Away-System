import { MemoryRouter } from 'react-router-dom';
import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import * as getAdminDashboardModule from '../../../src/services/getAdminDashboard.js';

describe('admin dashboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
});
