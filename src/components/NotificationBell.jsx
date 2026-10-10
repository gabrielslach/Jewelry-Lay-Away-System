import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BellIcon } from '../theme/icons.jsx';
import { getCustomerNotifications } from '../services/customerNotifications.js';
import './NotificationBell.css';

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getCustomerNotifications({ limit: 1 })
        .then((data) => {
          if (!cancelled) {
            setUnread(data.unread ?? 0);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setUnread(0);
          }
        });
    }
    load();
    function onFocus() {
      load();
    }
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <Link
      to="/account/notifications"
      className="notification-bell"
      aria-label="Notifications"
    >
      <BellIcon size={18} title="" />
      {unread > 0 ? <span className="bell-count">{unread}</span> : null}
    </Link>
  );
}
