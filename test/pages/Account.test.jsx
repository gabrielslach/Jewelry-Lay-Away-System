import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SessionProvider } from '../../src/components/SessionProvider.jsx';
import Account from '../../src/pages/Account.jsx';
import { loginCustomer } from '../../src/services/loginCustomer.js';

describe('Account', () => {
  it('shows Sample Client lay-aways after login', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    render(
      <MemoryRouter>
        <SessionProvider>
          <Account />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Sample Client')).toBeInTheDocument();
    expect(screen.getByText(/Solitaire Halo Ring/)).toBeInTheDocument();
    expect(screen.getByText(/Vintage Rose Pendant/)).toBeInTheDocument();
  });
});
