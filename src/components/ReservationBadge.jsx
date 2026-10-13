const RESERVATION_LABELS = {
  none: 'None',
  waiting_for_stock: 'Waiting for stock',
  reserved: 'Reserved',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const BADGE_CLASSES = { none: 'badge-mute', waiting_for_stock: 'badge-amber' };

export default function ReservationBadge({ status }) {
  const label = RESERVATION_LABELS[status];
  if (!label) {
    return null;
  }
  return (
    <span className={`badge ${BADGE_CLASSES[status] ?? 'badge-ok'}`}>{label}</span>
  );
}

export { RESERVATION_LABELS };
