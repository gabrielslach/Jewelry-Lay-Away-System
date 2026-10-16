import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AddStaffModal from '../../src/components/AddStaffModal.jsx';
import { signInAdmin, signOutAdmin } from '../helpers/adminAuth.js';

function fill(name, email, password) {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: name } });
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: password },
  });
}

describe('AddStaffModal', () => {
  beforeEach(signInAdmin);
  afterEach(signOutAdmin);

  it('shows field messages and does not submit invalid values', () => {
    const onSaved = vi.fn();
    render(<AddStaffModal full={[]} onClose={() => {}} onSaved={onSaved} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add staff' }));
    expect(screen.getByText('Enter a name.')).toBeInTheDocument();
    expect(screen.getByText('Enter an email.')).toBeInTheDocument();
    expect(screen.getByText('Enter a password.')).toBeInTheDocument();
    fill('Ann', 'nope', 'short');
    fireEvent.click(screen.getByRole('button', { name: 'Add staff' }));
    expect(screen.getByText('Enter a valid email.')).toBeInTheDocument();
    expect(
      screen.getByText('At least 8 characters.', { selector: '.field-error' }),
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('defaults to accounting when admin is full and disables the admin option', () => {
    render(
      <AddStaffModal full={['admin']} onClose={() => {}} onSaved={() => {}} />,
    );
    expect(screen.getByLabelText('Role')).toHaveValue('accounting');
    expect(
      screen.getByRole('option', { name: 'Admin (limit reached)' }),
    ).toBeDisabled();
  });

  it('creates the account and reports success', async () => {
    const onSaved = vi.fn();
    render(<AddStaffModal full={[]} onClose={() => {}} onSaved={onSaved} />);
    fill('Ann', 'ann@example.com', 'longenough');
    fireEvent.click(screen.getByRole('button', { name: 'Add staff' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('keeps the modal open and shows the API error', async () => {
    const onSaved = vi.fn();
    render(<AddStaffModal full={[]} onClose={() => {}} onSaved={onSaved} />);
    fill('Ann', 'accounting@samplejewelry.example', 'longenough');
    fireEvent.click(screen.getByRole('button', { name: 'Add staff' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with that email already exists',
    );
    expect(screen.getByLabelText('Name')).toHaveValue('Ann');
    expect(onSaved).not.toHaveBeenCalled();
  });
});
