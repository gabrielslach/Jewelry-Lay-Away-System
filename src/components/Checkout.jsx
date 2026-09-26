import { useMemo, useState } from 'react';
import { CheckIcon } from '../theme/assets.js';
import { createLayawayPlan, defaultDates } from '../services/createLayawayPlan.js';
import { mockGatewayPayment } from '../services/mockGatewayPayment.js';
import { ServiceError } from '../services/http.js';
import { formatPeso, splitAmount } from '../lib/money.js';
import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import Modal from './Modal.jsx';
import { useToast } from './useToast.js';
import './Checkout.css';
import './PieceDetail.css';

const TERMS = [
  { payments: 6, label: '3 Months (6 payments)' },
  { payments: 4, label: '2 Months (4 payments)' },
  { payments: 2, label: '1 Month (2 payments)' },
];

const PAY_METHODS = [
  { id: 'gcash', label: 'GCash / E-Wallet' },
  { id: 'bank', label: 'Bank Transfer' },
  { id: 'card', label: 'Credit / Debit Card' },
];

export default function Checkout({ piece, onClose, onScheduled, onPayMethod }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [payments, setPayments] = useState(6);
  const [dates, setDates] = useState(() => defaultDates(6));
  const [method, setMethod] = useState('gcash');
  const [planId, setPlanId] = useState(null);
  const [error, setError] = useState(null);

  const amounts = useMemo(
    () => splitAmount(piece.price, payments),
    [piece.price, payments],
  );

  function handleTermChange(event) {
    const count = Number(event.target.value);
    setPayments(count);
    setDates(defaultDates(count));
  }

  function handleDateChange(index, value) {
    setDates((current) => current.map((date, i) => (i === index ? value : date)));
  }

  async function handleContinue() {
    setError(null);
    try {
      if (step === 1) {
        const plan = await createLayawayPlan({
          productId: piece.id,
          paymentCount: payments,
          dates,
        });
        setPlanId(plan.id);
        onScheduled?.({ plan, payments, dates, amounts });
        setStep(2);
        return;
      }
      if (step === 2) {
        if (method !== 'bank' && planId) {
          await mockGatewayPayment({ planId, method });
        }
        onPayMethod?.(method);
        showToast(`Reservation submitted for ${piece.name}.`);
        setStep(3);
      }
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to continue checkout.');
    }
  }

  return (
    <Modal
      title="Reserve on Lay-Away"
      onClose={onClose}
      footer={
        step < 3 ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleContinue}>
              Continue
            </Button>
          </>
        ) : (
          <Button variant="primary" className="checkout-done" onClick={onClose}>
            Done
          </Button>
        )
      }
    >
      <ErrorMessage>{error}</ErrorMessage>
      {step === 1 ? (
        <>
          <div className="form-row">
            <label htmlFor="plan-term">Lay-Away Term</label>
            <select id="plan-term" value={payments} onChange={handleTermChange}>
              {TERMS.map((term) => (
                <option key={term.payments} value={term.payments}>
                  {term.label}
                </option>
              ))}
            </select>
          </div>
          <div className="plan-box">
            <h4>Choose Each Payment Date</h4>
            <div className="schedule-list">
              {dates.map((date, index) => (
                <div className="schedule-row" key={index}>
                  <span>Payment {index + 1}</span>
                  <input
                    type="date"
                    value={date}
                    aria-label={`Payment ${index + 1} date`}
                    onChange={(event) => handleDateChange(index, event.target.value)}
                  />
                  <b>{formatPeso(amounts[index])}</b>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
      {step === 2 ? (
        <div className="plan-box">
          <h4>Choose Payment Method</h4>
          <div className="pay-method-list">
            {PAY_METHODS.map((option) => (
              <label
                className={method === option.id ? 'pay-method selected' : 'pay-method'}
                key={option.id}
              >
                <input
                  type="radio"
                  name="payMethod"
                  value={option.id}
                  checked={method === option.id}
                  onChange={() => setMethod(option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="confirm-box">
          <div className="confirm-icon">
            <CheckIcon size={26} title="" />
          </div>
          <h3>Reservation Submitted</h3>
          <p>Our team will confirm your payment schedule and hold the piece for you.</p>
        </div>
      ) : null}
    </Modal>
  );
}
