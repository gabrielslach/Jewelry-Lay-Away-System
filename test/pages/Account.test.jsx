import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Account from '../../src/pages/Account.jsx';

describe('Account', () => {
  it('renders the account heading', () => {
    render(<Account />);
    expect(screen.getByRole('heading', { name: /my account/i })).toBeInTheDocument();
  });
});
