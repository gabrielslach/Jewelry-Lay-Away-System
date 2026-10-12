const RESERVATION_LABELS = {
  waiting_for_stock: 'Waiting for stock',
  reserved: 'Reserved',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function ReservationBadge({ status }) {
  const label = RESERVATION_LABELS[status];
  if (!label) {
    return null;
  }
  return (
    <span
      className={
        status === 'waiting_for_stock' ? 'badge badge-amber' : 'badge badge-ok'
      }
    >
      {label}
    </span>
  );
}

export { RESERVATION_LABELS };
