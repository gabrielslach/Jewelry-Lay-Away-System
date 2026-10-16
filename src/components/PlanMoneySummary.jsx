import { formatDisplayDate } from '../lib/dates.js';
import { formatPesoDecimals } from '../lib/money.js';
import { planTotals } from '../lib/planTotals.js';

export default function PlanMoneySummary({ plan }) {
  const { totalPayable, financedPrincipal, amountPaid, asOf } = planTotals(plan);
  return (
    <>
      <div className="plan-money">
        <div className="spec-item">
          <span>Total to be paid</span>
          <b className="plan-money-total">{formatPesoDecimals(totalPayable)}</b>
        </div>
        <div className="spec-item">
          <span>Financed amount</span>
          <b>{formatPesoDecimals(financedPrincipal)}</b>
        </div>
        <div className="spec-item">
          <span>Down payment</span>
          <b>{formatPesoDecimals(plan.down_payment_amount)}</b>
        </div>
        <div className="spec-item">
          <span>Paid so far</span>
          <b>{formatPesoDecimals(amountPaid)}</b>
        </div>
      </div>
      <p className="plan-as-of">Paid so far as of {formatDisplayDate(asOf)}</p>
    </>
  );
}
