import { useEffect, useMemo, useRef, useState } from 'react';
import ManualPaymentForm from './ManualPaymentForm.jsx';
import Modal from './Modal.jsx';
import PlanMoneySummary from './PlanMoneySummary.jsx';
import ProgressBar from './ProgressBar.jsx';
import ScheduleRow from './ScheduleRow.jsx';
import { formatDisplayDate } from '../lib/dates.js';
import { formatPesoDecimals } from '../lib/money.js';
import { planTotals } from '../lib/planTotals.js';
import {
  downPaymentRowState,
  effectiveStatus,
  installmentRowState,
} from '../lib/scheduleRow.js';
import { ChevronDownIcon } from '../theme/assets.js';
import Button from './Button.jsx';

const HIGHLIGHT_MS = 6000;
const SETTLED = ['paid', 'submitted', 'awaiting_confirmation'];

function planBadge(plan, waitingForStock) {
  if (waitingForStock) {
    return { className: 'badge badge-warn', label: 'Waiting for stock' };
  }
  return plan.status === 'ok' || plan.status === 'on_track'
    ? { className: 'badge badge-ok', label: 'On Track' }
    : { className: 'badge badge-warn', label: 'Overdue' };
}

export default function LayawayPlanCard({ plan, rejectionByPaymentId, onUpdated, focused = false }) {
  const [openPay, setOpenPay] = useState(null);
  const [expanded, setExpanded] = useState(focused);
  const [highlighted, setHighlighted] = useState(focused);
  const cardRef = useRef(null);
  const headerRef = useRef(null);
  const payTriggerRef = useRef(null);
  const waitingForStock = plan.reservation_status === 'waiting_for_stock';
  const graceDays = plan.grace_period_days;

  useEffect(() => {
    if (!focused) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cardRef.current.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    headerRef.current.focus({ preventScroll: true });
    const timer = setTimeout(() => setHighlighted(false), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [focused]);

  const installments = useMemo(
    () =>
      plan.installments
        .filter((row) => row.status !== 'superseded')
        .map((row) => {
          const rejection = rejectionByPaymentId?.[row.id];
          return {
            ...row,
            rejection_reason: row.rejection_reason ?? rejection,
          };
        }),
    [plan.installments, rejectionByPaymentId],
  );

  const downState = downPaymentRowState(plan);
  const rows = [];
  let blocked = waitingForStock || downState.key !== 'paid';
  let firstOpenTerm = null;
  installments.forEach((row, index) => {
    const termNumber = row.term_number ?? index + 1;
    const state = installmentRowState(row, {
      gracePeriodDays: graceDays,
      advanceEligible: !blocked,
    });
    const lockedBy = state.key === 'pending' && !state.showForm ? firstOpenTerm : null;
    rows.push({ row, state, termNumber, lockedBy });
    if (!SETTLED.includes(effectiveStatus(row))) {
      blocked = true;
      firstOpenTerm ??= termNumber;
    }
  });
  const firstLocked = rows.find((item) => item.lockedBy && !waitingForStock);

  const needsAttention = [downState, ...rows.map((item) => item.state)].filter(
    (state) => state.key === 'rejected' || state.key === 'overdue',
  ).length;
  const paidCount = installments.filter((row) => row.status === 'paid').length;
  const detailsId = `plan-${plan.id}-details`;
  const badge = planBadge(plan, waitingForStock);
  const { amountPaid, totalPayable } = planTotals({ ...plan, installments });
  const progressLabel = `Paid ${formatPesoDecimals(amountPaid)} of ${formatPesoDecimals(totalPayable)}`;

  function toggle() {
    setExpanded((open) => !open);
    if (expanded) setHighlighted(false);
  }

  function closePay() {
    setOpenPay(null);
    payTriggerRef.current?.focus();
  }

  const payTitle =
    openPay?.kind === 'down_payment'
      ? 'Pay down payment'
      : openPay?.early
        ? `Pay Payment ${openPay.termNumber} early`
        : openPay
          ? `Pay Payment ${openPay.termNumber}`
          : null;
  const payModal = openPay ? (
    <Modal title={payTitle} onClose={closePay}>
      {openPay.early ? (
        <p className="field-hint">
          This payment isn&apos;t due until {formatDisplayDate(openPay.dueDate)}. Paying early is
          optional and won&apos;t change your other due dates.
        </p>
      ) : null}
      <ManualPaymentForm
        planId={plan.id}
        kind={openPay.kind}
        installmentId={openPay.installmentId}
        expectedAmount={
          openPay.kind === 'down_payment' ? plan.down_payment_amount : openPay.amount
        }
        onCancel={closePay}
        onSuccess={() => {
          closePay();
          onUpdated?.();
        }}
      />
    </Modal>
  ) : null;

  return (
    <div
      ref={cardRef}
      className={`plan-card${highlighted ? ' plan-card-focused' : ''}`}
      data-plan-id={plan.id}
    >
      <button
        ref={headerRef}
        type="button"
        className="plan-header"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={toggle}
      >
        {highlighted ? <span className="badge badge-info plan-just-reserved">Just reserved</span> : null}
        <span className="plan-header-row">
          <span className="plan-header-title">{plan.item_name}</span>
          <span className={`plan-chevron${expanded ? ' plan-chevron-open' : ''}`}>
            <ChevronDownIcon />
          </span>
        </span>
        <span className="plan-header-row plan-header-badges">
          <span className={badge.className}>{badge.label}</span>
          {needsAttention ? (
            <span className="badge badge-warn">
              {needsAttention} {needsAttention === 1 ? 'payment needs' : 'payments need'} attention
            </span>
          ) : null}
        </span>
        <span className="plan-header-row plan-header-due">
          <span>{plan.next_due ? `Next due ${plan.next_due}` : 'No payment due'}</span>
          <span className="plan-header-count">
            {paidCount} of {installments.length} paid
          </span>
        </span>
      </button>
      <div className="plan-progress">
        <ProgressBar
          value={amountPaid}
          max={totalPayable}
          tone={plan.status === 'ok' || plan.status === 'on_track' ? 'ok' : 'warn'}
          label={progressLabel}
        />
      </div>
      <div className="plan-body" id={detailsId} hidden={!expanded}>
        {waitingForStock ? (
          <div className="plan-notice">
            <b>Waiting for stock</b>
            <p>
              Your down payment is confirmed. We will email you once your piece is reserved.
            </p>
          </div>
        ) : null}
        <div className="plan-top">
          <p className="plan-meta">
            {plan.plan_label}
            <br />
            Order #{plan.id}
          </p>
        </div>
        <PlanMoneySummary plan={plan} />
        <h4 className="plan-schedule-heading">Payment schedule</h4>
        <div className="schedule-list">
          <ScheduleRow title="Down payment" state={downState} amount={plan.down_payment_amount}>
            {downState.showForm && !waitingForStock ? (
              <Button
                variant="outline"
                size="sm"
                className="plan-row-action"
                onClick={() => setOpenPay({ kind: 'down_payment' })}
              >
                {downState.payLabel}
              </Button>
            ) : null}
          </ScheduleRow>
          {rows.map(({ row, state, termNumber }) => (
            <ScheduleRow
              key={row.id}
              title={`Payment ${termNumber}`}
              state={state}
              amount={row.amount}
            >
              {state.showForm && !waitingForStock ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="plan-row-action"
                  onClick={(event) => {
                    payTriggerRef.current = event.currentTarget;
                    setOpenPay({
                      kind: 'installment',
                      installmentId: row.id,
                      termNumber,
                      amount: row.amount,
                      early: state.key === 'pending',
                      dueDate: row.due_date,
                    });
                  }}
                >
                  {state.payLabel}
                </Button>
              ) : null}
              {firstLocked?.row === row ? (
                <span className="plan-row-meta">Pay Payment {firstLocked.lockedBy} first</span>
              ) : null}
            </ScheduleRow>
          ))}
        </div>
      </div>
      {payModal}
    </div>
  );
}
