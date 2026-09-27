import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import * as getAdminSettingsModule from '../../../src/services/getAdminSettings.js';

describe('admin settings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows form, toggle, and save skeleton bones until settings load', async () => {
    const realGetAdminSettings = getAdminSettingsModule.getAdminSettings;
    let resolve;
    vi.spyOn(getAdminSettingsModule, 'getAdminSettings').mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(
      <MemoryRouter initialEntries={['/admin/settings']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Business Settings' })).toBeInTheDocument();
    expect(document.querySelector('.skeleton[aria-busy="true"]')).toBeInTheDocument();
    expect(document.querySelectorAll('.settings-form .form-row .skeleton-bone')).toHaveLength(6);
    expect(document.querySelectorAll('.settings-form .toggle-row .skeleton-bone')).toHaveLength(6);
    expect(document.querySelector('.settings-form .skeleton-bone-btn')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Mine Credit')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
    resolve(await realGetAdminSettings());
    expect(await screen.findByDisplayValue('Mine Credit')).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('.skeleton[aria-busy="true"]')).not.toBeInTheDocument();
    });
  });

  it('saves business settings', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByDisplayValue('Mine Credit')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByText('Settings saved.')).toBeInTheDocument();
  });

  it('names each settings switch from its row label', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByDisplayValue('Mine Credit')).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Require full payment before item release' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Send SMS payment reminders' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Allow customer-selected due dates' }),
    ).toBeInTheDocument();
  });
});
