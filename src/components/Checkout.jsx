import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLayawayPlan } from '../services/createLayawayPlan.js';
import { getLayawayPreview } from '../services/getLayawayPreview.js';
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

function termLabel(option) {
  const monthLabel = option.term_months === 1 ? '1 Month' : `${option.term_months} Months`;
  return `${monthLabel} · ${option.installments} payments`;
}

export default function Checkout({ piece, onClose, onScheduled }) {
  const { customer } = useSession();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(Boolean(customer));
  const [previewError, setPreviewError] = useState(null);
  const [previewBlocked, setPreviewBlocked] = useState(false);
  const [termMonths, setTermMonths] = useState(null);
  const [plan, setPlan] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [showDownPaymentForm, setShowDownPaymentForm] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  useEffect(() => {
    if (!customer) return undefined;
    let cancelled = false;
    getLayawayPreview({ productId: piece.id })
      .then((data) => {
        if (cancelled) return;
        setPreview(data);
        setPreviewError(null);
        setPreviewBlocked(false);
        const options = data.options ?? [];
        const defaultTerm =
          options.find((row) => row.term_months === data.max_term_months)?.term_months ??
          options[options.length - 1]?.term_months ??
          null;
        setTermMonths(defaultTerm);
      })
      .catch((err) => {
        if (cancelled) return;
        setPreview(null);
        const message =
          err instanceof ServiceError ? err.message : 'Unable to load lay-away preview.';
        setPreviewError(message);
        setPreviewBlocked(err instanceof ServiceError && err.status === 409);
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [customer, piece.id, loadKey]);

  function handleRetryPreview() {
    setPreview(null);
    setPreviewError(null);
    setPreviewBlocked(false);
    setPreviewLoading(true);
    setLoadKey((key) => key + 1);
  }

  const selectedOption = preview?.options?.find((row) => row.term_months === termMonths);
  const schedule = plan?.schedule ?? selectedOption?.schedule ?? [];
  const downPayment = plan?.down_payment_amount ?? preview?.down_payment_amount;

  function handleClose() {
    onClose();
    if (plan) {
      navigate(`/account?plan=${encodeURIComponent(plan.id)}`);
    }
  }

  async function handleConfirm() {
    setError(null);
    if (plan) {
      setShowDownPaymentForm(true);
      return;
    }
    setCreating(true);
    try {
      const created = await createLayawayPlan({
        productId: piece.id,
        termMonths,
      });
      setPlan(created);
      onScheduled?.({ plan: created, termMonths });
      setShowDownPaymentForm(true);
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to confirm lay-away.');
    } finally {
      setCreating(false);
    }
  }

  if (!customer) {
    const from = encodeURIComponent(`/collections/${piece.id}?reserve=1`);
    return (
      <Modal
        title="Reserve on Lay-Away"
        onClose={handleClose}
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

  if (showDownPaymentForm && plan) {
    return (
      <Modal title="Pay down payment" onClose={handleClose}>
        <ManualPaymentForm
          planId={plan.id}
          kind="down_payment"
          expectedAmount={plan.down_payment_amount}
          onSuccess={() => {
            setShowDownPaymentForm(false);
            handleClose();
          }}
        />
      </Modal>
    );
  }

  const canConfirm =
    !previewLoading && !previewBlocked && !previewError && selectedOption && !creating;

  return (
    <Modal
      title="Reserve on Lay-Away"
      onClose={handleClose}
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!canConfirm}>
            Confirm lay-away
          </Button>
        </>
      }
    >
      <ErrorMessage>{error || previewError}</ErrorMessage>
      {previewLoading ? <p className="field-hint">Loading lay-away options…</p> : null}
      {previewError && !previewBlocked ? (
        <Button variant="outline" onClick={handleRetryPreview}>
          Retry
        </Button>
      ) : null}
      {preview && !previewBlocked ? (
        <>
          <div className="form-row">
            <label htmlFor="plan-term">Lay-Away Term</label>
            <select
              id="plan-term"
              value={termMonths ?? ''}
              disabled={Boolean(plan)}
              onChange={(event) => setTermMonths(Number(event.target.value))}
            >
              {(preview.options ?? []).map((option) => (
                <option key={option.term_months} value={option.term_months}>
                  {termLabel(option)}
                </option>
              ))}
            </select>
          </div>
          <div className="plan-box">
            <h4>Down payment</h4>
            <div className="schedule-row">
              <span>Due now</span>
              <b>{formatPesoDecimals(downPayment)}</b>
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
            <p className="field-hint">
              {plan
                ? 'Confirm again to open the down-payment form. A down payment is required to start this lay-away.'
                : 'Dates are illustrative until you confirm. Confirm to create your plan and open the down-payment form.'}
            </p>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
