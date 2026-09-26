import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { useSession } from '../components/useSession.js';
import { HamburgerIcon, Logo } from '../theme/assets.js';
import './StorefrontLayout.css';

const sectionLinks = [
  { href: '/collections', label: 'Collections' },
  { href: '/#how', label: 'How Lay-Away Works' },
  { href: '/#reviews', label: 'Reviews' },
  { href: '/#contact', label: 'Contact' },
];

export default function StorefrontLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { customer } = useSession();

  function closeMenu() {
    setMenuOpen(false);
  }

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
            <Button variant="outline" size="sm" to={accountTo}>
              My Account
            </Button>
            <Button variant="primary" size="sm" to="/collections">
              Start a Lay-Away
            </Button>
            <button
              className="hamburger"
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-panel"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <HamburgerIcon title="" />
            </button>
          </div>
        </div>
        <div
          className={menuOpen ? 'mobile-panel open' : 'mobile-panel'}
          id="mobile-panel"
          hidden={!menuOpen}
        >
          {sectionLinks.map((link) =>
            link.href.startsWith('/#') ? (
              <a key={link.href} href={link.href} onClick={closeMenu}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} to={link.href} onClick={closeMenu}>
                {link.label}
              </Link>
            ),
          )}
          <NavLink to={accountTo} onClick={closeMenu}>
            My Account
          </NavLink>
        </div>
      </nav>
      <main className="storefront-main">
        <Outlet />
      </main>
      <footer className="site-footer" id="contact">
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
