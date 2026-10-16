import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AdminOnly from '../../src/components/AdminOnly.jsx';
import { signInAdmin, signOutAdmin } from '../helpers/adminAuth.js';

describe('AdminOnly', () => {
  afterEach(signOutAdmin);

  it('renders children for admins', async () => {
    await signInAdmin('admin');
    render(<AdminOnly message="No">Secret</AdminOnly>);
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });

  it('shows the message instead for accounting', async () => {
    await signInAdmin('accounting');
    render(<AdminOnly message="No">Secret</AdminOnly>);
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });
});
