import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../src/App.jsx';

describe('Register', () => {
  it('creates an account from the form', async () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Pat Patron' } });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'pat@sampleemail.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByRole('heading', { name: 'My Account' })).toBeInTheDocument();
    expect(screen.getByText('Pat Patron')).toBeInTheDocument();
  });
});
