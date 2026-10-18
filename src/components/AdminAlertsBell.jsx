import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon } from '../theme/icons.jsx';
import { formatRelativeTime } from '../lib/dates.js';
import { firstSentence } from '../lib/text.js';
import {
  getAdminNotifications,
  markAdminNotificationsRead,
} from '../services/adminAlerts.js';
import './AdminAlertsBell.css';

export default function AdminAlertsBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const rootRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    function loadNotifications() {
      getAdminNotifications({ limit: 4 })
        .then((data) => {
          if (!cancelled) {
            setUnread(data.unread ?? 0);
            setItems(data.items ?? []);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setUnread(0);
            setItems([]);
          }
        });
    }
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function onDocClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  async function markAll() {
    await markAdminNotificationsRead();
    getAdminNotifications({ limit: 4 })
      .then((data) => {
        setUnread(data.unread ?? 0);
        setItems(data.items ?? []);
      })
      .catch(() => {
        setUnread(0);
        setItems([]);
      });
  }

  return (
    <div className="admin-bell-wrap" ref={rootRef}>
      <button
        type="button"
        className="admin-bell-btn"
        aria-label="Alerts"
        onClick={() => setOpen((value) => !value)}
      >
        <BellIcon title="" />
        {unread > 0 ? <span className="bell-count">{unread}</span> : null}
      </button>
      {open ? (
        <div className="bell-panel">
          <div className="bell-panel-head">
            <b>Alerts</b>
            <button type="button" className="text-link" onClick={markAll}>
              Mark all read
            </button>
          </div>
          {items.slice(0, 4).map((item) => (
            <div className="bell-panel-item" key={item.id}>
              <b>{item.title}</b>
              <p>{firstSentence(item.body ?? '').trim()}</p>
              <span>{formatRelativeTime(item.created_at)}</span>
            </div>
          ))}
          <Link
            to="/admin/notifications"
            className="text-link bell-panel-footer"
            onClick={() => setOpen(false)}
          >
            See all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}
