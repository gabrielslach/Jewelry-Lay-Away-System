import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Logo from '../../src/theme/Logo.jsx';

describe('Logo', () => {
  it('renders the store lockup image', () => {
    render(<Logo />);
    const img = screen.getByRole('img', { name: 'Mine Credit' });
    expect(img).toHaveAttribute('src', '/store-logo.png');
    expect(screen.queryByText('Sample Jewelry Co.')).not.toBeInTheDocument();
    expect(screen.queryByText('Mine Credit')).not.toBeInTheDocument();
  });

  it('keeps the logo class when a className is passed', () => {
    const { container } = render(<Logo className="extra" />);
    expect(container.firstChild).toHaveClass('logo', 'extra');
  });

  it('uses a logo class on an inline tag so CSS can size the box', () => {
    const { container } = render(<Logo as="span" />);
    expect(container.firstChild.tagName).toBe('SPAN');
    expect(container.firstChild).toHaveClass('logo');
  });

  it('renders as a heading when asked', () => {
    render(<Logo as="h1" />);
    expect(
      screen.getByRole('heading', { name: 'Mine Credit' }),
    ).toBeInTheDocument();
  });

  it('typesets Mine Credit once when withName is set', () => {
    const { container } = render(<Logo withName />);
    expect(container.firstChild).toHaveClass('logo', 'logo--named');
    expect(screen.getByText('Mine Credit')).toHaveClass('logo-name');
    expect(screen.getAllByText('Mine Credit')).toHaveLength(1);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', '/store-logo.png');
    expect(img).toHaveAttribute('alt', '');
  });
});
