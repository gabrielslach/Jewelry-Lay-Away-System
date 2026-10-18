import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminAlertsBell from '../../src/components/AdminAlertsBell.jsx';
import * as adminAlerts from '../../src/services/adminAlerts.js';

describe('AdminAlertsBell', () => {
  it('opens the alerts panel and marks all read', async () => {
    vi.spyOn(adminAlerts, 'getAdminNotifications').mockResolvedValue({
      unread: 1,
      items: [
        {
          id: 1,
          title: 'Payment submitted',
          body: 'A payment is waiting. Review it in Orders.',
          created_at: new Date().toISOString(),
        },
      ],
    });
    const markRead = vi
      .spyOn(adminAlerts, 'markAdminNotificationsRead')
      .mockResolvedValue({ ok: true });
    render(
      <MemoryRouter>
        <AdminAlertsBell />
      </MemoryRouter>,
    );
    expect(await screen.findByText('1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Alerts' }));
    expect(screen.getByText('Payment submitted')).toBeInTheDocument();
    expect(screen.getByText('A payment is waiting.')).toBeInTheDocument();
    expect(screen.queryByText(/Review it in Orders/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
    expect(markRead).toHaveBeenCalled();
  });
});
