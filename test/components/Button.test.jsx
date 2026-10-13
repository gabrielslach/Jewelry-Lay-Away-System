import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

  it('does not fire clicks when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Pay
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pay' }));
    expect(screen.getByRole('button', { name: 'Pay' })).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('uses the primary variant by default and honours the variant prop', () => {
    render(
      <>
        <Button>Pay</Button>
        <Button variant="outline">Cancel</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Pay' })).toHaveClass('btn-primary');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('btn-outline');
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
