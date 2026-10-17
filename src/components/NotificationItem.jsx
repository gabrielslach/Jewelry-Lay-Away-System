import { formatRelativeTime } from '../lib/dates.js';
import Button from './Button.jsx';

export default function NotificationItem({ item, icon, onMarkRead }) {
  return (
    <li className={item.read_at ? 'notification read' : 'notification'}>
      {icon ? <div className="notification-icon">{icon}</div> : null}
      <div className="notification-body">
        <b>{item.title}</b>
        <p>{item.body}</p>
        <span className="notification-time">{formatRelativeTime(item.created_at)}</span>
      </div>
      {!item.read_at ? (
        <Button variant="outline" size="sm" onClick={() => onMarkRead(item.id)}>
          Mark read
        </Button>
      ) : null}
    </li>
  );
}
