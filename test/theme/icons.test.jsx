import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CheckIcon, CloseIcon, HamburgerIcon } from '../../src/theme/icons.jsx';

describe('icons', () => {
  it('renders the menu icon', () => {
    render(<HamburgerIcon />);
    expect(screen.getByRole('img', { name: 'Menu' })).toBeInTheDocument();
  });

  it('renders the close icon', () => {
    render(<CloseIcon />);
    expect(screen.getByRole('img', { name: 'Close' })).toBeInTheDocument();
  });

  it('renders the success icon', () => {
    render(<CheckIcon />);
    expect(screen.getByRole('img', { name: 'Success' })).toBeInTheDocument();
  });
});
