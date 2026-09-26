import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../src/App.jsx';

describe('Login', () => {
  it('signs in the seeded customer', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { name: 'My Account' })).toBeInTheDocument();
    expect(screen.getByText('client@sampleemail.com')).toBeInTheDocument();
  });
});
