import { PLAN_STATUSES } from '../lib/planStatuses.js';

export default function PlanStatusBadge({ status }) {
  const known = PLAN_STATUSES[status];
  if (!known) {
    return null;
  }
  return <span className={`badge ${known.className}`}>{known.label}</span>;
}
