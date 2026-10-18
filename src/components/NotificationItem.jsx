import { useState } from 'react';
import { formatRelativeTime } from '../lib/dates.js';
import { firstSentence } from '../lib/text.js';
import Button from './Button.jsx';

export default function NotificationItem({ item, icon, onMarkRead }) {
  const [expanded, setExpanded] = useState(false);
  const body = item.body ?? '';
  const summary = firstSentence(body).trim();
  const expandable = body.trim().length > summary.length;
  return (
    <li className={item.read_at ? 'notification read' : 'notification'}>
      {icon ? <div className="notification-icon">{icon}</div> : null}
      <div className="notification-body">
        <b>{item.title}</b>
        <p className={expanded ? 'notification-full' : undefined}>
          {expanded || !expandable ? body : summary}
        </p>
        <div className="notification-meta">
          {expandable ? (
            <button
              type="button"
              className="notification-toggle"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? 'Show less' : 'Show more'}
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
                <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          ) : null}
          <span className="notification-time">{formatRelativeTime(item.created_at)}</span>
        </div>
      </div>
      {!item.read_at ? (
        <Button variant="outline" size="sm" onClick={() => onMarkRead(item.id)}>
          Mark read
        </Button>
      ) : null}
    </li>
  );
}
