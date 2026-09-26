import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
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

export default function StorefrontLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef(null);
  const { customer } = useSession();

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

    const query = window.matchMedia('(min-width: 681px)');
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

  const accountTo = customer ? '/account' : '/login';

  return (
    <div className="storefront">
      <nav className="pv-nav" aria-label="Storefront">
        <div className="pv-nav-inner">
          <Link to="/" onClick={closeMenu}>
            <Logo as="span" />
          </Link>
          <div className="pv-links">
            {sectionLinks.map((link) =>
              link.href.startsWith('/#') ? (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
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
              to={accountTo}
            >
              My Account
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
                <a key={link.href} href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
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
              to={accountTo}
              onClick={closeMenu}
            >
              My Account
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
              <a href="/#how">Lay-Away Plans</a>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <a href="/#contact">Contact Us</a>
              <a href="/#contact">FAQ</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="/#contact">About</a>
              <a href="/#reviews">Reviews</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          Sample data shown for demonstration purposes only. © 2026 Sample Jewelry
          Co. (fictional).
        </div>
      </footer>
    </div>
  );
}
