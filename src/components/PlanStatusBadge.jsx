import { planStatusDisplay } from '../lib/planStatuses.js';

export default function PlanStatusBadge({ status }) {
  if (!status) {
    return null;
  }
  const { label, className } = planStatusDisplay(status);
  return <span className={`badge ${className}`}>{label}</span>;
}
