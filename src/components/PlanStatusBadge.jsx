import { PLAN_STATUSES } from '../lib/planStatuses.js';

function titleCase(status) {
  return String(status)
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function PlanStatusBadge({ status }) {
  if (!status) {
    return null;
  }
  const known = PLAN_STATUSES[status] ?? {
    label: titleCase(status),
    className: 'badge-mute',
  };
  return <span className={`badge ${known.className}`}>{known.label}</span>;
}
