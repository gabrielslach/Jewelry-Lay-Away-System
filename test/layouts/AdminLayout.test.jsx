import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AdminLayout from '../../src/layouts/AdminLayout.jsx';
import { getAdminToken } from '../../src/services/session.js';
import { signInAdmin, signOutAdmin } from '../helpers/adminAuth.js';

describe('AdminLayout', () => {
  beforeEach(async () => {
    await signInAdmin();
  });

  afterEach(() => {
    signOutAdmin();
  });

  it('opens the mobile sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('navigation', { name: 'Admin' })).toBeInTheDocument();
    const sidebar = document.querySelector('.admin-sidebar');
    expect(sidebar.querySelector('.logo-name')).toBeNull();
    expect(within(sidebar).queryByText('Mine Credit')).not.toBeInTheDocument();
    expect(within(sidebar).getByRole('img', { name: 'Mine Credit' })).toBeInTheDocument();
  });

  it('shows the admin name in the top bar and highlights only Due & Overdue on its page', () => {
    render(
      <MemoryRouter initialEntries={['/admin/payments/due']}>
        <Routes>
          <Route path="/admin/payments/due" element={<AdminLayout />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Sample Admin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Due & Overdue/ })).toHaveClass('active');
    expect(screen.getByRole('link', { name: /Pending payments/ })).not.toHaveClass('active');
  });

  it('signs out and goes to admin login', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin/login" element={<h1>Admin sign in</h1>} />
          <Route path="/admin" element={<AdminLayout />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(screen.getByRole('heading', { name: 'Admin sign in' })).toBeInTheDocument();
    expect(getAdminToken()).toBeFalsy();
  });

  it('redirects to admin login when signed out', () => {
    signOutAdmin();
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <Routes>
          <Route path="/admin/login" element={<h1>Admin sign in</h1>} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="orders" element={<p>Orders</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Admin sign in' })).toBeInTheDocument();
    expect(screen.queryByText('Orders')).not.toBeInTheDocument();
  });

  it('shows Staff and Bank accounts links to admins in order', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />} />
        </Routes>
      </MemoryRouter>,
    );
    const labels = within(screen.getByRole('navigation', { name: 'Admin' }))
      .getAllByRole('link')
      .map((link) => link.textContent);
    expect(labels.slice(-4)).toEqual(['Customers', 'Staff', 'Bank accounts', 'Settings']);
  });

  it('hides Staff and Bank accounts links from accounting', async () => {
    await signInAdmin('accounting');
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link', { name: 'Staff' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Bank accounts' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Customers' })).toBeInTheDocument();
  });
});
