import { useEffect, useState } from 'react';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import NotificationItem from '../../components/NotificationItem.jsx';
import {
  getAdminNotifications,
  markAdminNotificationsRead,
} from '../../services/adminAlerts.js';
import { ServiceError } from '../../services/http.js';
import '../../pages/Account.css';

export default function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  function load() {
    getAdminNotifications()
      .then((data) => setItems(data.items ?? []))
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load notifications.');
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function markAll() {
    await markAdminNotificationsRead();
    load();
  }

  async function markOne(id) {
    await markAdminNotificationsRead([id]);
    load();
  }

  return (
    <div className="panel">
      <div className="account-head">
        <h2>Notifications</h2>
        {items.some((row) => !row.read_at) ? (
          <button type="button" className="text-link" onClick={markAll}>
            Mark all as read
          </button>
        ) : null}
      </div>
      <p className="page-lead">
        Every alert is also emailed to active admins and, when enabled in Settings, accounting
        accounts.
      </p>
      <ErrorMessage>{error}</ErrorMessage>
      {items.length ? (
        <ul className="notification-list">
          {items.map((item) => (
            <NotificationItem key={item.id} item={item} onMarkRead={markOne} />
          ))}
        </ul>
      ) : (
        <p className="empty-copy">No alerts yet.</p>
      )}
    </div>
  );
}
