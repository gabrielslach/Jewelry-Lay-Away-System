import { useState } from 'react';
import { formatRelativeTime } from '../lib/dates.js';
import Button from './Button.jsx';

function firstSentence(text) {
  const match = text.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return match ? match[0] : text;
}

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
        {expandable ? (
          <button
            type="button"
            className="text-link"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        ) : null}
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
