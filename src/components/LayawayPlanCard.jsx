import { useMemo, useState } from 'react';
import ManualPaymentForm from './ManualPaymentForm.jsx';
import Modal from './Modal.jsx';
import { formatPesoDecimals } from '../lib/money.js';
import {
  downPaymentRowState,
  installmentRowState,
} from '../lib/scheduleRow.js';
import Button from './Button.jsx';

function ScheduleLine({
  title,
  state,
  amount,
  children,
}) {
  return (
    <div className="schedule-row schedule-row-rich">
      <div className="schedule-row-main">
        <b>{title}</b>
        <span>{formatPesoDecimals(amount)}</span>
        <span className={state.badgeClass ?? 'badge'}>{state.badge}</span>
      </div>
      {state.dateLabel ? <span className="schedule-meta">{state.dateLabel}</span> : null}
      {state.graceNote ? <span className="schedule-meta">{state.graceNote}</span> : null}
      {state.note ? <span className="schedule-meta">{state.note}</span> : null}
      {children}
    </div>
  );
}

export default function LayawayPlanCard({ plan, rejectionByPaymentId, onUpdated }) {
  const [openPay, setOpenPay] = useState(null);
  const waitingForStock = plan.reservation_status === 'waiting_for_stock';
  const graceDays = plan.grace_period_days;

  const installments = useMemo(
    () =>
      plan.installments.map((row) => {
        const rejection = rejectionByPaymentId?.[row.id];
        return {
          ...row,
          rejection_reason: row.rejection_reason ?? rejection,
        };
      }),
    [plan.installments, rejectionByPaymentId],
  );

  function badgeClass(status) {
    return status === 'ok' || status === 'on_track' ? 'badge badge-ok' : 'badge badge-warn';
  }

  function badgeLabel(status) {
    return status === 'ok' || status === 'on_track' ? 'On Track' : 'Overdue';
  }

  const payTitle =
    openPay?.kind === 'down_payment'
      ? 'Pay down payment'
      : openPay?.kind === 'installment'
        ? `Pay Payment ${openPay.termNumber}`
        : null;
  const payModal = openPay ? (
    <Modal title={payTitle} onClose={() => setOpenPay(null)}>
      <ManualPaymentForm
        planId={plan.id}
        kind={openPay.kind}
        installmentId={openPay.installmentId}
        expectedAmount={
          openPay.kind === 'down_payment' ? plan.down_payment_amount : openPay.amount
        }
        onCancel={() => setOpenPay(null)}
        onSuccess={() => {
          setOpenPay(null);
          onUpdated?.();
        }}
      />
    </Modal>
  ) : null;

  return (
    <div className="plan-box">
      <h3 className="plan-title">
        <span>{plan.item_name}</span>
        {waitingForStock ? (
          <span className="badge badge-warn">Waiting for stock</span>
        ) : (
          <span className={badgeClass(plan.status)}>{badgeLabel(plan.status)}</span>
        )}
      </h3>
      {waitingForStock ? (
        <div className="plan-notice">
          <b>Waiting for stock</b>
          <p>
            Your down payment is confirmed. We will email you once your piece is reserved.
          </p>
        </div>
      ) : null}
      <p className="plan-meta">
        {plan.plan_label} · Order #{plan.id} · Next Due {plan.next_due}
      </p>
      <div className="schedule-list">
        <DownPaymentRow
          plan={plan}
          suppressPay={waitingForStock}
          onPay={() => setOpenPay({ kind: 'down_payment' })}
        />
        {installments.map((row) => {
          const state = installmentRowState(row, { gracePeriodDays: graceDays });
          const termNumber = row.term_number ?? row.id;
          const canPay = state.showForm && !waitingForStock;
          return (
            <ScheduleLine
              key={row.id}
              title={`Payment ${termNumber}`}
              state={state}
              amount={row.amount}
            >
              {canPay ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setOpenPay({
                      kind: 'installment',
                      installmentId: row.id,
                      termNumber,
                      amount: row.amount,
                    })
                  }
                >
                  {state.payLabel}
                </Button>
              ) : null}
            </ScheduleLine>
          );
        })}
      </div>
      {payModal}
    </div>
  );
}

function DownPaymentRow({ plan, suppressPay, onPay }) {
  const state = downPaymentRowState(plan);
  const canPay = state.showForm && !suppressPay;
  return (
    <ScheduleLine title="Down payment" state={state} amount={plan.down_payment_amount}>
      {canPay ? (
        <Button variant="outline" size="sm" onClick={onPay}>
          {state.payLabel ?? 'Pay'}
        </Button>
      ) : null}
    </ScheduleLine>
  );
}
