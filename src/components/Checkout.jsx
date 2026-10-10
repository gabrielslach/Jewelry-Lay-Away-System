import { useState } from 'react';
import { createLayawayPlan } from '../services/createLayawayPlan.js';
import { termMonthOptions } from '../data/plans.js';
import { ServiceError } from '../services/http.js';
import { formatDisplayDate } from '../lib/dates.js';
import { formatPesoDecimals } from '../lib/money.js';
import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import ManualPaymentForm from './ManualPaymentForm.jsx';
import Modal from './Modal.jsx';
import { useSession } from './useSession.js';
import './Checkout.css';
import './PieceDetail.css';

const TERM_OPTIONS = termMonthOptions(3);

export default function Checkout({ piece, onClose, onScheduled }) {
  const { customer } = useSession();
  const [termMonths, setTermMonths] = useState(TERM_OPTIONS[0].termMonths);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [showDownPaymentForm, setShowDownPaymentForm] = useState(false);

  const schedule = plan?.schedule ?? [];

  async function handleContinue() {
    setError(null);
    try {
      const created = await createLayawayPlan({
        productId: piece.id,
        termMonths,
      });
      setPlan(created);
      onScheduled?.({ plan: created, termMonths });
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to continue checkout.');
    }
  }

  if (!customer) {
    const from = encodeURIComponent(`/collections/${piece.id}?reserve=1`);
    return (
      <Modal
        title="Reserve on Lay-Away"
        onClose={onClose}
        footer={
          <>
            <Button variant="outline" to={`/register?from=${from}`}>
              Create account
            </Button>
            <Button variant="primary" to={`/login?from=${from}`}>
              Sign in
            </Button>
          </>
        }
      >
        <div className="confirm-box">
          <h3>Sign in to reserve</h3>
          <p>Your lay-away plan is saved to your account so you can track payments in My Account.</p>
        </div>
      </Modal>
    );
  }

  const footer = !plan ? (
    <>
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleContinue}>
        Continue
      </Button>
    </>
  ) : null;

  return (
    <Modal title="Reserve on Lay-Away" onClose={onClose} footer={footer}>
      <ErrorMessage>{error}</ErrorMessage>
      {!plan ? (
        <div className="form-row">
          <label htmlFor="plan-term">Lay-Away Term</label>
          <select
            id="plan-term"
            value={termMonths}
            onChange={(event) => setTermMonths(Number(event.target.value))}
          >
            {TERM_OPTIONS.map((term) => (
              <option key={term.termMonths} value={term.termMonths}>
                {term.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="plan-box">
          <h4>Down payment</h4>
          <div className="schedule-row">
            <span>Due now</span>
            <b>{formatPesoDecimals(plan.down_payment_amount)}</b>
          </div>
          <h4>Payment schedule</h4>
          <div className="schedule-list">
            {schedule.map((row) => (
              <div className="schedule-row" key={row.term_number}>
                <span>
                  Payment {row.term_number} · {formatDisplayDate(row.due_date)}
                </span>
                <b>{formatPesoDecimals(row.amount)}</b>
              </div>
            ))}
          </div>
          {!showDownPaymentForm ? (
            <Button variant="primary" onClick={() => setShowDownPaymentForm(true)}>
              Pay down payment
            </Button>
          ) : (
            <ManualPaymentForm
              planId={plan.id}
              kind="down_payment"
              expectedAmount={plan.down_payment_amount}
              onCancel={() => setShowDownPaymentForm(false)}
              onSuccess={() => {
                setShowDownPaymentForm(false);
                onClose();
              }}
            />
          )}
        </div>
      )}
    </Modal>
  );
}
