import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../../src/App.jsx';
import { signInAdmin, signOutAdmin } from '../helpers/adminAuth.js';

describe('Admin', () => {
  beforeEach(async () => {
    await signInAdmin();
  });

  afterEach(() => {
    signOutAdmin();
  });

  it('renders dashboard KPIs', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Collected This Month')).toBeInTheDocument();
  });

  it('sends signed-out admin visits to admin login', () => {
    signOutAdmin();
    render(
      <MemoryRouter initialEntries={['/admin/settings']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Admin sign in' })).toBeInTheDocument();
    expect(screen.queryByText('Business settings')).not.toBeInTheDocument();
  });
});
