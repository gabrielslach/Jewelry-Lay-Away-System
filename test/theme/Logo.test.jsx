import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Logo from '../../src/theme/Logo.jsx';

describe('Logo', () => {
  it('renders the default wordmark', () => {
    render(<Logo />);
    expect(screen.getByText('Sample Jewelry Co.')).toBeInTheDocument();
  });

  it('keeps the wordmark class when a className is passed', () => {
    const { container } = render(<Logo className="extra" />);
    expect(container.firstChild).toHaveClass('logo', 'extra');
  });

  it('renders as a heading when asked', () => {
    render(<Logo as="h1" />);
    expect(
      screen.getByRole('heading', { name: 'Sample Jewelry Co.' }),
    ).toBeInTheDocument();
  });
});
