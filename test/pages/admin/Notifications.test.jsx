import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import { signInAdmin, signOutAdmin } from '../../helpers/adminAuth.js';
import * as adminAlerts from '../../../src/services/adminAlerts.js';

describe('admin notifications page', () => {
  beforeEach(async () => {
    await signInAdmin();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('lists staff alerts', async () => {
    vi.spyOn(adminAlerts, 'getAdminNotifications').mockResolvedValue({
      unread: 0,
      items: [
        {
          id: 3,
          title: 'Waiting for stock',
          body: 'Plan LA-1001 is waiting for stock.',
          created_at: '2026-10-09T12:00:00.000Z',
        },
      ],
    });
    render(
      <MemoryRouter initialEntries={['/admin/notifications']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Waiting for stock')).toBeInTheDocument();
    expect(
      screen.getByText('Plan LA-1001 is waiting for stock.'),
    ).toBeInTheDocument();
  });

  it('marks a single alert read', async () => {
    const list = vi.spyOn(adminAlerts, 'getAdminNotifications').mockResolvedValue({
      unread: 1,
      items: [
        { id: 3, title: 'Waiting for stock', body: 'Body', created_at: '2026-10-09T12:00:00.000Z' },
        {
          id: 4,
          title: 'Old alert',
          body: 'Body',
          created_at: '2026-10-08T12:00:00.000Z',
          read_at: '2026-10-09T00:00:00.000Z',
        },
      ],
    });
    const mark = vi.spyOn(adminAlerts, 'markAdminNotificationsRead').mockResolvedValue({});
    render(
      <MemoryRouter initialEntries={['/admin/notifications']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText('Waiting for stock');
    expect(screen.getAllByRole('button', { name: 'Mark read' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Mark read' }));
    await waitFor(() => expect(mark).toHaveBeenCalledWith([3]));
    await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(1));
  });
});
