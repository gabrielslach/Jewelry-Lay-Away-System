import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NotificationBell from '../../src/components/NotificationBell.jsx';
import * as customerNotifications from '../../src/services/customerNotifications.js';

describe('NotificationBell', () => {
  it('links to notifications and shows an unread count', async () => {
    vi.spyOn(customerNotifications, 'getCustomerNotifications').mockResolvedValue({
      unread: 2,
      items: [],
    });
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Notifications' })).toHaveAttribute(
      'href',
      '/account/notifications',
    );
    expect(await screen.findByText('2')).toBeInTheDocument();
  });
});
