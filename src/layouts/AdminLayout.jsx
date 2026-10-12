import { useEffect, useState } from 'react';
import {
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import AdminAlertsBell from '../components/AdminAlertsBell.jsx';
import Button from '../components/Button.jsx';
import { Logo } from '../theme/assets.js';
import { HamburgerIcon } from '../theme/icons.jsx';
import { getAdminAlerts } from '../services/adminAlerts.js';
import {
  clearAdminSession,
  getAdmin,
  getAdminToken,
} from '../services/session.js';
import './AdminLayout.css';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  {
    to: '/admin/orders',
    label: 'Orders & Installments',
    badgeKeys: ['waiting_for_stock', 'reservation_problems'],
  },
  {
    to: '/admin/payments',
    label: 'Pending payments',
    end: true,
    badgeKey: 'pending_payments',
  },
  {
    to: '/admin/payments/due',
    label: 'Due & Overdue',
    badgeKeys: ['due_today', 'overdue'],
  },
  {
    to: '/admin/notifications',
    label: 'Notifications',
    badgeKey: 'unread_notifications',
  },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/settings', label: 'Settings' },
];

const titles = {
  '/admin': 'Dashboard',
  '/admin/orders': 'Orders & Installments',
  '/admin/payments': 'Pending payments',
  '/admin/payments/due': 'Due & Overdue',
  '/admin/notifications': 'Notifications',
  '/admin/customers': 'Customers',
  '/admin/settings': 'Settings',
};

function badgeCount(alerts, link) {
  if (!alerts) {
    return 0;
  }
  if (link.badgeKey) {
    return alerts[link.badgeKey] ?? 0;
  }
  if (link.badgeKeys) {
    return link.badgeKeys.reduce((sum, key) => sum + (alerts[key] ?? 0), 0);
  }
  return 0;
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const title = titles[location.pathname] || 'Admin';
  const token = getAdminToken();
  const admin = getAdmin();

  useEffect(() => {
    if (!token) {
      return undefined;
    }
    function load() {
      getAdminAlerts()
        .then(setAlerts)
        .catch(() => setAlerts(null));
    }
    load();
    const timer = window.setInterval(load, 60_000);
    return () => window.clearInterval(timer);
  }, [token]);

  function signOut() {
    clearAdminSession();
    navigate('/admin/login');
  }

  if (!token) {
    const from = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/admin/login?from=${from}`} replace />;
  }

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
          {links.map((link) => {
            const count = badgeCount(alerts, link);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  isActive ? 'sb-link active' : 'sb-link'
                }
                onClick={() => setOpen(false)}
              >
                <span>{link.label}</span>
                {count > 0 ? <span className="sb-badge">{count}</span> : null}
              </NavLink>
            );
          })}
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
          {admin?.name ? (
            <span className="admin-user">{admin.name}</span>
          ) : null}
          <AdminAlertsBell />
          <Button
            variant="outline"
            size="sm"
            className="admin-signout"
            onClick={signOut}
          >
            Sign out
          </Button>
        </header>
        <div className="admin-page">
          <Outlet context={{ alerts }} />
        </div>
      </div>
    </div>
  );
}
