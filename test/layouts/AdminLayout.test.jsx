import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AdminLayout from '../../src/layouts/AdminLayout.jsx';

describe('AdminLayout', () => {
  it('opens the mobile sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminLayout />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('navigation', { name: 'Admin' })).toBeInTheDocument();
    const sidebar = document.querySelector('.admin-sidebar');
    expect(sidebar.querySelector('.logo-name')).toBeNull();
    expect(within(sidebar).queryByText('Mine Credit')).not.toBeInTheDocument();
    expect(
      within(sidebar).getByRole('img', { name: 'Mine Credit' }),
    ).toBeInTheDocument();
  });
});
