import { useMemo, useState } from 'react';
import { createLayawayPlan, defaultDates } from '../data/plans.js';
import { formatPeso, splitAmount } from '../lib/money.js';
import Button from './Button.jsx';
import Modal from './Modal.jsx';
import './Checkout.css';
import './PieceDetail.css';

const TERMS = [
  { payments: 6, label: '3 Months (6 payments)' },
  { payments: 4, label: '2 Months (4 payments)' },
  { payments: 2, label: '1 Month (2 payments)' },
];

export default function Checkout({ piece, onClose, onScheduled }) {
  const [payments, setPayments] = useState(6);
  const [dates, setDates] = useState(() => defaultDates(6));

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
    const plan = await createLayawayPlan({
      productId: piece.id,
      paymentCount: payments,
      dates,
    });
    onScheduled?.({ plan, payments, dates, amounts });
  }

  return (
    <Modal
      title="Reserve on Lay-Away"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleContinue}>
            Continue
          </Button>
        </>
      }
    >
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
    </Modal>
  );
}
