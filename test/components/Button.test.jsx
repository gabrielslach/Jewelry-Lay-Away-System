import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Button from '../../src/components/Button.jsx';

describe('Button', () => {
  it('renders a button by default', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('renders a compact control when size is sm', () => {
    render(<Button size="sm">Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('btn-sm');
  });

  it('renders a link when given a to prop', () => {
    render(
      <MemoryRouter>
        <Button to="/account">My Account</Button>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'My Account' })).toHaveAttribute(
      'href',
      '/account',
    );
  });
});
