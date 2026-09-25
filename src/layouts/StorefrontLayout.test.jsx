import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StorefrontLayout from './StorefrontLayout.jsx';

function renderLayout() {
  return render(
    <MemoryRouter>
      <StorefrontLayout />
    </MemoryRouter>,
  );
}

describe('StorefrontLayout', () => {
  it('renders storefront navigation and footer', () => {
    renderLayout();
    expect(
      screen.getByRole('navigation', { name: 'Storefront' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Account' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(screen.getByRole('link', { name: 'Start a Lay-Away' })).toHaveAttribute(
      'href',
      '/#collections',
    );
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      /sample data shown for demonstration purposes only/i,
    );
  });

  it('opens the mobile menu', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
