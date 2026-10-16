import { Navigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { CheckIcon } from '../theme/icons.jsx';
import { WarnIcon } from '../theme/icons.jsx';
import { formatRelativeTime } from '../lib/dates.js';
import {
  getCustomerNotifications,
  markCustomerNotificationsRead,
} from '../services/customerNotifications.js';
import { ServiceError } from '../services/http.js';
import { useSession } from '../components/useSession.js';
import './Account.css';

function NotificationIcon({ kind }) {
  if (kind === 'payment_rejected' || kind === 'due_today' || kind === 'plan_closed') {
    return <WarnIcon />;
  }
  return <CheckIcon title="" />;
}

export default function AccountNotifications() {
  const { customer } = useSession();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    return getCustomerNotifications()
      .then((data) => {
        setItems(data.items ?? []);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load notifications.');
      });
  }, []);

  useEffect(() => {
    if (!customer) {
      return undefined;
    }
    let cancelled = false;
    getCustomerNotifications()
      .then((data) => {
        if (!cancelled) {
          setItems(data.items ?? []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ServiceError ? err.message : 'Unable to load notifications.');
        }
      });
    function onFocus() {
      load();
    }
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [customer, load]);

  if (!customer) {
    return <Navigate to="/login?from=/account/notifications" replace />;
  }

  async function markAll() {
    await markCustomerNotificationsRead();
    load();
  }

  async function markOne(id) {
    await markCustomerNotificationsRead([id]);
    load();
  }

  return (
    <section className="page-block">
      <div className="account-head">
        <h1>Notifications</h1>
        {items.some((row) => !row.read_at) ? (
          <button type="button" className="text-link" onClick={markAll}>
            Mark all as read
          </button>
        ) : null}
      </div>
      <p className="page-lead">Every email we send about your plan is also kept here.</p>
      <ErrorMessage>{error}</ErrorMessage>
      {items.length ? (
        <ul className="notification-list">
          {items.map((item) => (
            <li key={item.id} className={item.read_at ? 'notification read' : 'notification'}>
              <div className="notification-icon">
                <NotificationIcon kind={item.kind} />
              </div>
              <div className="notification-body">
                <b>{item.title}</b>
                <p>{item.body}</p>
                <span className="notification-time">{formatRelativeTime(item.created_at)}</span>
              </div>
              {!item.read_at ? (
                <button type="button" className="text-link" onClick={() => markOne(item.id)}>
                  Mark read
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-copy">No notifications yet.</p>
      )}
      <Button variant="outline" to="/account">
        Back to My Account
      </Button>
    </section>
  );
}
