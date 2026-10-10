import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ForgotPassword from '../../src/pages/ForgotPassword.jsx';
import * as customerPassword from '../../src/services/customerPassword.js';

describe('ForgotPassword', () => {
  it('shows a neutral success message after submit', async () => {
    vi.spyOn(customerPassword, 'forgotCustomerPassword').mockResolvedValue({ ok: true });
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'client@sampleemail.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(
      await screen.findByText('If that email is registered, we sent a link.'),
    ).toBeInTheDocument();
  });
});
