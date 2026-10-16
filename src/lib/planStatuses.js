export const PLAN_STATUSES = {
  on_track: { label: 'On Track', className: 'badge-ok' },
  active: { label: 'Active', className: 'badge-ok' },
  overdue: { label: 'Overdue', className: 'badge-warn' },
  completed: { label: 'Completed', className: 'badge-info' },
  cancelled: { label: 'Cancelled', className: 'badge-mute' },
  defaulted: { label: 'Defaulted', className: 'badge-warn' },
};

function titleCase(status) {
  return String(status)
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function planStatusDisplay(status) {
  return PLAN_STATUSES[status] ?? { label: titleCase(status), className: 'badge-mute' };
}
