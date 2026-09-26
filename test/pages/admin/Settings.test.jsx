import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../../src/App.jsx';

describe('admin settings', () => {
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
