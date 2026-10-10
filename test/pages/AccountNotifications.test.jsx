import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionProvider } from '../../src/components/SessionProvider.jsx';
import AccountNotifications from '../../src/pages/AccountNotifications.jsx';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import * as customerNotifications from '../../src/services/customerNotifications.js';

describe('AccountNotifications', () => {
  it('lists notifications and marks all as read', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    vi.spyOn(customerNotifications, 'getCustomerNotifications').mockResolvedValue({
      unread: 1,
      items: [
        {
          id: 1,
          kind: 'payment_rejected',
          title: 'Payment rejected',
          body: 'Blurry proof',
          read_at: null,
          created_at: '2026-10-10T10:00:00.000Z',
        },
      ],
    });
    const markRead = vi
      .spyOn(customerNotifications, 'markCustomerNotificationsRead')
      .mockResolvedValue({ ok: true });
    render(
      <MemoryRouter>
        <SessionProvider>
          <AccountNotifications />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Payment rejected')).toBeInTheDocument();
    expect(screen.getByText('Blurry proof')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(markRead).toHaveBeenCalled();
  });
});
