import { formatPesoDecimals } from '../lib/money.js';

export default function ScheduleRow({ title, state, amount, children }) {
  const notes = [state.dateLabel, state.graceNote].filter(Boolean).join(' · ');
  return (
    <div className="plan-row">
      <div className="plan-row-text">
        <b>{title}</b>
        {notes ? <span className="plan-row-meta">{notes}</span> : null}
        {state.note ? (
          <span className={`plan-row-meta${state.key === 'rejected' ? ' plan-row-warn' : ''}`}>
            {state.note}
          </span>
        ) : null}
      </div>
      <div className="plan-row-amount">
        <b>{formatPesoDecimals(amount)}</b>
        <span className={state.badgeClass ?? 'badge'}>{state.badge}</span>
      </div>
      {children}
    </div>
  );
}
