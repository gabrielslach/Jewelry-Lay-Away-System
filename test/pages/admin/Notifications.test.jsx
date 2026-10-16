import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
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
});
