import { useEffect, useState } from 'react';
import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import { todayIsoLocal } from '../lib/dates.js';
import { formatPesoDecimals } from '../lib/money.js';
import {
  mapPaymentError,
  validatePaymentForm,
} from '../lib/paymentValidation.js';
import { getBankAccounts } from '../services/getBankAccounts.js';
import { ServiceError } from '../services/http.js';
import {
  submitDownPaymentManual,
  submitInstallmentManual,
} from '../services/submitManualPayment.js';
import { useToast } from './useToast.js';
import './ManualPaymentForm.css';

export default function ManualPaymentForm({
  planId,
  kind,
  installmentId,
  expectedAmount,
  onSuccess,
  onCancel,
}) {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [bankAccountId, setBankAccountId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [amount, setAmount] = useState(String(expectedAmount ?? ''));
  const [paidOn, setPaidOn] = useState(todayIsoLocal());
  const [proofFile, setProofFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getBankAccounts()
      .then((rows) => {
        setAccounts(rows);
        if (rows.length === 1) {
          setBankAccountId(String(rows[0].id));
        }
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const today = todayIsoLocal();
    const clientErrors = validatePaymentForm({
      bankAccountId,
      referenceNumber,
      amount,
      paidOn,
      today,
    });
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    const payload = {
      bank_account_id: bankAccountId,
      reference_number: referenceNumber.trim(),
      amount,
      paid_on: paidOn,
      ...(proofFile ? { proof_of_payment: proofFile } : {}),
      ...(installmentId ? { installment_id: installmentId } : {}),
    };
    try {
      const submit =
        kind === 'down_payment' ? submitDownPaymentManual : submitInstallmentManual;
      const result = await submit(planId, payload);
      showToast('Payment submitted - awaiting confirmation.');
      onSuccess?.(result);
    } catch (err) {
      if (err instanceof ServiceError) {
        setFieldErrors(mapPaymentError(err.status, err.message));
      } else {
        setFieldErrors({ form: 'Unable to submit payment.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="manual-payment-form" onSubmit={handleSubmit}>
      <p className="payment-intro">
        Step 1: transfer {formatPesoDecimals(expectedAmount)} to one of our accounts. Step 2: tell
        us the details below so we can confirm it.
      </p>
      <ErrorMessage>{fieldErrors.form}</ErrorMessage>
      {loadingAccounts ? <p>Loading bank accounts…</p> : null}
      <div className="bank-card-grid">
        {accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            className={
              String(bankAccountId) === String(account.id)
                ? 'bank-card selected'
                : 'bank-card'
            }
            onClick={() => setBankAccountId(String(account.id))}
          >
            <b>{account.bank_name}</b>
            <span>Account name: {account.account_name}</span>
            <span>Account no.: {account.account_number}</span>
            {account.qr_code_url ? (
              <img src={account.qr_code_url} alt="" className="bank-qr" />
            ) : null}
          </button>
        ))}
      </div>
      {fieldErrors.bank_account_id ? (
        <p className="field-error">{fieldErrors.bank_account_id}</p>
      ) : null}
      <div className="form-row">
        <label htmlFor={`ref-${planId}-${installmentId ?? 'dp'}`}>Reference number</label>
        <input
          id={`ref-${planId}-${installmentId ?? 'dp'}`}
          value={referenceNumber}
          maxLength={100}
          placeholder="BT-20261105-77"
          onChange={(event) => setReferenceNumber(event.target.value)}
        />
        {fieldErrors.reference_number ? (
          <p className="field-error">{fieldErrors.reference_number}</p>
        ) : null}
      </div>
      <div className="form-row">
        <label htmlFor={`amount-${planId}-${installmentId ?? 'dp'}`}>Amount sent</label>
        <input
          id={`amount-${planId}-${installmentId ?? 'dp'}`}
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        {fieldErrors.amount ? <p className="field-error">{fieldErrors.amount}</p> : null}
      </div>
      <div className="form-row">
        <label htmlFor={`paid-${planId}-${installmentId ?? 'dp'}`}>Date paid</label>
        <input
          id={`paid-${planId}-${installmentId ?? 'dp'}`}
          type="date"
          max={todayIsoLocal()}
          value={paidOn}
          onChange={(event) => setPaidOn(event.target.value)}
        />
        {fieldErrors.paid_on ? <p className="field-error">{fieldErrors.paid_on}</p> : null}
      </div>
      <div className="form-row">
        <label htmlFor={`proof-${planId}-${installmentId ?? 'dp'}`}>
          Proof of payment (optional)
        </label>
        <input
          id={`proof-${planId}-${installmentId ?? 'dp'}`}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
        />
        <span className="field-hint">
          Click to attach a screenshot or receipt (JPG, PNG or PDF).
        </span>
      </div>
      <div className="form-actions">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={submitting}>
          Submit payment
        </Button>
      </div>
    </form>
  );
}
