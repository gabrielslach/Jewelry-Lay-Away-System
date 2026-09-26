import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '../theme/assets.js';
import { HamburgerIcon } from '../theme/icons.jsx';
import './AdminLayout.css';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/orders', label: 'Orders & Installments' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/settings', label: 'Settings' },
];

const titles = {
  '/admin': 'Dashboard',
  '/admin/orders': 'Orders & Installments',
  '/admin/customers': 'Customers',
  '/admin/settings': 'Settings',
};

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const title = titles[location.pathname] || 'Admin';

  return (
    <div className="admin-shell">
      <div
        className={open ? 'sidebar-backdrop' : 'sidebar-backdrop hidden'}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside className={open ? 'admin-sidebar open' : 'admin-sidebar'}>
        <Logo as="span" />
        <nav aria-label="Admin">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'sb-link active' : 'sb-link')}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-hamburger"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <HamburgerIcon title="" />
          </button>
          <h1>{title}</h1>
        </header>
        <div className="admin-page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
