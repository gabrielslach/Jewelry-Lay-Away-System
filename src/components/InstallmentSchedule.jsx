import { formatDisplayDate } from '../lib/dates.js';
import { effectiveStatus } from '../lib/scheduleRow.js';
import './Checkout.css';

function statusBadge(status, dueDate) {
  if (status === 'paid') {
    return <span className="badge badge-ok">Paid</span>;
  }
  if (status === 'overdue') {
    return <span className="badge badge-warn">Overdue</span>;
  }
  if (status === 'submitted' || status === 'awaiting_confirmation') {
    return <span className="badge badge-info">Awaiting confirmation</span>;
  }
  return <span className="schedule-due">{formatDisplayDate(dueDate)}</span>;
}

export default function InstallmentSchedule({ installments }) {
  return (
    <div className="schedule-list">
      {installments.map((row, index) => (
        <div className="schedule-row" key={row.id}>
          <b>
            Payment {row.term_number ?? index + 1} of {installments.length}
          </b>
          <span>₱{Number(row.amount).toLocaleString('en-US')}</span>
          {statusBadge(effectiveStatus(row), row.due_date)}
        </div>
      ))}
    </div>
  );
}
