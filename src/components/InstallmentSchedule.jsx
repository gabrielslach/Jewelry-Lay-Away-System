import { formatDisplayDate } from '../lib/dates.js';
import {
  closedRowState,
  effectiveStatus,
  installmentRowState,
} from '../lib/scheduleRow.js';
import './Checkout.css';

const CLOSED_SCHEDULE_PLAN_STATUSES = ['defaulted', 'cancelled'];

function statusBadge(status, dueDate) {
  if (status === 'paid') {
    return <span className="badge badge-ok">Paid</span>;
  }
  if (status === 'overdue') {
    return <span className="badge badge-warn">Overdue</span>;
  }
  if (status === 'rejected') {
    return (
      <>
        <span className="schedule-due">{formatDisplayDate(dueDate)}</span>
        <span className="badge badge-warn">Rejected</span>
      </>
    );
  }
  if (status === 'submitted' || status === 'awaiting_confirmation') {
    return <span className="badge badge-info">Awaiting confirmation</span>;
  }
  return <span className="schedule-due">{formatDisplayDate(dueDate)}</span>;
}

function closedBadge(row, planStatus) {
  const state = closedRowState(
    installmentRowState(row),
    planStatus,
    formatDisplayDate(row.due_date),
  );
  if (state.key !== 'closed') {
    return null;
  }
  return (
    <>
      <span className="schedule-due">{state.dateLabel}</span>
      <span className={state.badgeClass}>{state.badge}</span>
    </>
  );
}

export default function InstallmentSchedule({ installments, planStatus }) {
  const closedPlan = CLOSED_SCHEDULE_PLAN_STATUSES.includes(planStatus);
  return (
    <div className="schedule-list">
      {installments.map((row, index) => {
        const badge =
          (closedPlan && closedBadge(row, planStatus)) ||
          statusBadge(effectiveStatus(row), row.due_date);
        return (
          <div className="schedule-row" key={row.id}>
            <b>
              Payment {row.term_number ?? index + 1} of {installments.length}
            </b>
            <span>₱{Number(row.amount).toLocaleString('en-US')}</span>
            {badge}
            {effectiveStatus(row) === 'rejected' && row.rejection_reason ? (
              <span className="schedule-note">
                Rejected: {row.rejection_reason}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
