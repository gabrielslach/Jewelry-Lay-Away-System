import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionProvider } from '../../src/components/SessionProvider.jsx';
import StorefrontLayout from '../../src/layouts/StorefrontLayout.jsx';
import { loginCustomer } from '../../src/services/loginCustomer.js';

function renderLayout(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <SessionProvider>
        <Routes>
          <Route element={<StorefrontLayout />}>
            <Route
              path="*"
              element={
                <>
                  <div id="how">How</div>
                  <div id="reviews">Reviews</div>
                  <div id="collections">Collections</div>
                </>
              }
            />
          </Route>
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
}

function panel() {
  return document.getElementById('mobile-panel');
}

describe('StorefrontLayout', () => {
  it('renders storefront navigation and footer', () => {
    renderLayout();
    expect(
      screen.getByRole('navigation', { name: 'Storefront' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Account' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('link', { name: 'Start a Lay-Away' })).toHaveAttribute(
      'href',
      '/collections',
    );
    expect(screen.getByRole('link', { name: 'Start a Lay-Away' })).toHaveClass(
      'btn',
      'btn-primary',
    );
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      /sample data shown for demonstration purposes only/i,
    );
    const nav = screen.getByRole('navigation', { name: 'Storefront' });
    const home = within(nav).getByRole('link', { name: 'Mine Credit' });
    expect(home).toHaveAttribute('href', '/');
    expect(within(home).getByRole('img', { name: 'Mine Credit' })).toHaveAttribute(
      'src',
      '/store-logo.png',
    );
    expect(
      within(screen.getByRole('contentinfo')).getByRole('img', {
        name: 'Mine Credit',
      }),
    ).toHaveAttribute('src', '/store-logo.png');
  });

  it('keeps the closed menu button labeled Menu', () => {
    renderLayout();
    const menu = screen.getByRole('button', { name: 'Menu' });
    expect(menu).toHaveAttribute('aria-controls', 'mobile-panel');
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('mobile-overlay')).not.toBeInTheDocument();
  });

  it('opens the mobile menu with Close menu and panel destinations', () => {
    renderLayout();
    openMenu();

    const close = screen.getByRole('button', { name: 'Close menu' });
    expect(close).toHaveAttribute('aria-expanded', 'true');
    expect(close).toHaveAttribute('aria-controls', 'mobile-panel');

    const menu = within(panel());
    expect(menu.getByRole('link', { name: 'Collections' })).toHaveAttribute(
      'href',
      '/collections',
    );
    expect(menu.getByRole('link', { name: 'How Lay-Away Works' })).toHaveAttribute(
      'href',
      '/#how',
    );
    expect(menu.getByRole('link', { name: 'Reviews' })).toHaveAttribute(
      'href',
      '/#reviews',
    );
    expect(menu.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '/#contact',
    );
    expect(menu.getByRole('link', { name: 'My Account' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(
      menu.queryByRole('link', { name: 'Start a Lay-Away' }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('mobile-overlay')).toBeInTheDocument();
  });

  it('links My Account in the panel to /account when signed in', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    renderLayout();
    openMenu();
    expect(
      within(panel()).getByRole('link', { name: 'My Account' }),
    ).toHaveAttribute('href', '/account');
  });

  it('closes the menu when the overlay is clicked', () => {
    renderLayout();
    openMenu();
    fireEvent.click(screen.getByTestId('mobile-overlay'));
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('closes the menu on Escape', () => {
    renderLayout();
    openMenu();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('closes the menu when a panel link is clicked', () => {
    renderLayout();
    openMenu();
    fireEvent.click(within(panel()).getByRole('link', { name: 'Collections' }));
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('keeps Start a Lay-Away as chrome primary to collections', () => {
    renderLayout();
    const nav = screen.getByRole('navigation', { name: 'Storefront' });
    const cta = within(nav).getByRole('link', { name: 'Start a Lay-Away' });
    expect(cta).toHaveAttribute('href', '/collections');
    expect(cta).toHaveClass('btn', 'btn-primary');
  });

  it('points section links at home hashes from collections', () => {
    renderLayout(['/collections']);
    const nav = screen.getByRole('navigation', { name: 'Storefront' });
    expect(
      within(nav).getByRole('link', { name: 'How Lay-Away Works' }),
    ).toHaveAttribute('href', '/#how');
    expect(within(nav).getByRole('link', { name: 'Reviews' })).toHaveAttribute(
      'href',
      '/#reviews',
    );
    expect(within(nav).getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '/#contact',
    );

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: 'Lay-Away Plans' })).toHaveAttribute(
      'href',
      '/#how',
    );
    expect(within(footer).getByRole('link', { name: 'Reviews' })).toHaveAttribute(
      'href',
      '/#reviews',
    );
    expect(within(footer).getAllByRole('link', { name: 'Contact Us' })[0]).toHaveAttribute(
      'href',
      '/#contact',
    );
  });

  it('scrolls hash targets into view', () => {
    const scrollIntoView = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      renderLayout(['/#how']);
      expect(scrollIntoView).toHaveBeenCalled();
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });
});
