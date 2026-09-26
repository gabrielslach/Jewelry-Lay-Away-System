import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Admin from '../../src/pages/Admin.jsx';

describe('Admin', () => {
  it('renders the admin heading', () => {
    render(<Admin />);
    expect(screen.getByRole('heading', { name: /^admin$/i })).toBeInTheDocument();
  });
});
