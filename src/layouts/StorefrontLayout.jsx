import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { useSession } from '../components/useSession.js';
import { CloseIcon, HamburgerIcon, Logo } from '../theme/assets.js';
import './StorefrontLayout.css';

const sectionLinks = [
  { href: '/collections', label: 'Collections' },
  { href: '/#how', label: 'How Lay-Away Works' },
  { href: '/#reviews', label: 'Reviews' },
  { href: '/#contact', label: 'Contact' },
];

const hashSectionIds = new Set(['how', 'reviews', 'contact', 'collections']);

export default function StorefrontLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef(null);
  const { customer } = useSession();
  const location = useLocation();

  function closeMenu() {
    setMenuOpen(false);
  }

  function closeMenuAndFocus() {
    setMenuOpen(false);
    hamburgerRef.current?.focus();
  }

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const query = window.matchMedia('(min-width: 910px)');
    function onChange(event) {
      if (event.matches) {
        setMenuOpen(false);
      }
    }

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    const id = location.hash.replace(/^#/, '');
    if (!hashSectionIds.has(id)) {
      return;
    }
    document.getElementById(id)?.scrollIntoView();
  }, [location.pathname, location.hash]);

  const account = customer
    ? { to: '/account', label: 'My Account' }
    : { to: '/login', label: 'Sign in' };

  return (
    <div className="storefront">
      <nav className="pv-nav" aria-label="Storefront">
        <div className="pv-nav-inner">
          <Link to="/" onClick={closeMenu}>
            <Logo as="span" withName />
          </Link>
          <div className="pv-links">
            {sectionLinks.map((link) =>
              link.href.startsWith('/#') ? (
                <Link key={link.href} to={{ pathname: '/', hash: link.href.slice(1) }}>
                  {link.label}
                </Link>
              ) : (
                <Link key={link.href} to={link.href}>
                  {link.label}
                </Link>
              ),
            )}
          </div>
          <div className="pv-nav-right">
            <Button
              className="pv-account-chrome"
              variant="outline"
              size="sm"
              to={account.to}
            >
              {account.label}
            </Button>
            <Button variant="primary" size="sm" to="/collections" onClick={closeMenu}>
              Start a Lay-Away
            </Button>
            <button
              ref={hamburgerRef}
              className={menuOpen ? 'hamburger open' : 'hamburger'}
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-panel"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <CloseIcon size={18} title="" />
              ) : (
                <HamburgerIcon size={20} title="" />
              )}
            </button>
          </div>
        </div>
        <div
          className={menuOpen ? 'mobile-panel open' : 'mobile-panel'}
          id="mobile-panel"
          hidden={!menuOpen}
        >
          <div className="mobile-panel-links">
            {sectionLinks.map((link) =>
              link.href.startsWith('/#') ? (
                <Link
                  key={link.href}
                  to={{ pathname: '/', hash: link.href.slice(1) }}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ) : (
                <NavLink key={link.href} to={link.href} end onClick={closeMenu}>
                  {link.label}
                </NavLink>
              ),
            )}
          </div>
          <div className="mobile-panel-account">
            <Button
              className="pv-account-panel"
              variant="outline"
              size="sm"
              to={account.to}
              onClick={closeMenu}
            >
              {account.label}
            </Button>
          </div>
        </div>
      </nav>
      {menuOpen ? (
        <div
          className="mobile-overlay"
          data-testid="mobile-overlay"
          role="presentation"
          aria-hidden="true"
          tabIndex={-1}
          onClick={closeMenuAndFocus}
        />
      ) : null}
      <main className="storefront-main" inert={menuOpen ? '' : undefined}>
        <Outlet />
      </main>
      <footer className="site-footer" id="contact" inert={menuOpen ? '' : undefined}>
        <div className="footer-inner">
          <div>
            <Logo as="span" />
            <p className="footer-blurb">
              Fine jewelry with flexible lay-away plans. Sample storefront for demo
              purposes.
            </p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Shop</h4>
              <Link to="/collections">Collections</Link>
              <Link to={{ pathname: '/', hash: '#how' }}>Lay-Away Plans</Link>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <Link to={{ pathname: '/', hash: '#contact' }}>Contact Us</Link>
              <Link to={{ pathname: '/', hash: '#contact' }}>FAQ</Link>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link to={{ pathname: '/', hash: '#contact' }}>About</Link>
              <Link to={{ pathname: '/', hash: '#reviews' }}>Reviews</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          Sample data shown for demonstration purposes only. © 2026 Mine Credit
          (fictional).
        </div>
      </footer>
    </div>
  );
}
