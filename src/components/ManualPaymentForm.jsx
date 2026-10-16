import { useEffect, useRef, useState } from 'react';
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

const SUBMIT_FAILED = "We couldn't submit your payment. Check your connection and try again.";

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
  const formRef = useRef(null);
  const focusErrorsRef = useRef(false);

  useEffect(() => {
    getBankAccounts()
      .then((rows) => {
        setAccounts(rows);
        if (rows.length >= 1) {
          setBankAccountId(String(rows[0].id));
        }
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  }, []);

  useEffect(() => {
    if (!focusErrorsRef.current) {
      return;
    }
    focusErrorsRef.current = false;
    formRef.current
      .querySelector('[aria-invalid="true"], [role="alert"]')
      ?.focus();
  }, [fieldErrors]);

  function showErrors(errors) {
    focusErrorsRef.current = true;
    setFieldErrors(errors);
  }

  function editField(setValue, errorKey) {
    return (event) => {
      setValue(event.target.value);
      setFieldErrors((errors) => ({ ...errors, [errorKey]: undefined }));
    };
  }

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
      showErrors(clientErrors);
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
        showErrors(mapPaymentError(err.status, err.message || SUBMIT_FAILED));
      } else {
        showErrors({ form: SUBMIT_FAILED });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const bankSelectId = `bank-${planId}-${installmentId ?? 'dp'}`;
  const selectedAccount = accounts.find(
    (account) => String(account.id) === String(bankAccountId),
  );

  return (
    <form ref={formRef} className="manual-payment-form" onSubmit={handleSubmit}>
      <p className="payment-intro">
        Step 1: transfer {formatPesoDecimals(expectedAmount)} to one of our accounts. Step 2: tell
        us the details below so we can confirm it.
      </p>
      <ErrorMessage tabIndex={-1}>{fieldErrors.form}</ErrorMessage>
      <fieldset className="form-fields" disabled={submitting}>
      {loadingAccounts ? <p>Loading bank accounts…</p> : null}
      {!loadingAccounts ? (
        <div className="form-row">
          <label htmlFor={bankSelectId}>Transfer to</label>
          <select
            id={bankSelectId}
            value={bankAccountId}
            disabled={accounts.length === 0}
            aria-invalid={Boolean(fieldErrors.bank_account_id)}
            onChange={editField(setBankAccountId, 'bank_account_id')}
          >
            {accounts.length === 0 ? (
              <option value="">No banks available</option>
            ) : (
              accounts.map((account) => (
                <option key={account.id} value={String(account.id)}>
                  {account.bank_name}
                </option>
              ))
            )}
          </select>
          {fieldErrors.bank_account_id ? (
            <p className="field-error">{fieldErrors.bank_account_id}</p>
          ) : null}
        </div>
      ) : null}
      {selectedAccount ? (
        <div className="bank-account-detail" aria-live="polite">
          <div className="bank-account-detail-text">
            <b>{selectedAccount.bank_name}</b>
            <span>Account name: {selectedAccount.account_name}</span>
            <span>Account no.: {selectedAccount.account_number}</span>
          </div>
          {selectedAccount.qr_code_url ? (
            <img
              src={selectedAccount.qr_code_url}
              alt=""
              className="bank-account-qr"
            />
          ) : null}
        </div>
      ) : null}
      <div className="form-row">
        <label htmlFor={`ref-${planId}-${installmentId ?? 'dp'}`}>Reference number</label>
        <input
          id={`ref-${planId}-${installmentId ?? 'dp'}`}
          value={referenceNumber}
          maxLength={100}
          placeholder="BT-20261105-77"
          aria-invalid={Boolean(fieldErrors.reference_number)}
          onChange={editField(setReferenceNumber, 'reference_number')}
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
          aria-invalid={Boolean(fieldErrors.amount)}
          onChange={editField(setAmount, 'amount')}
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
          aria-invalid={Boolean(fieldErrors.paid_on)}
          onChange={editField(setPaidOn, 'paid_on')}
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
      </fieldset>
      {submitting ? (
        <p className="sr-only" role="status">
          Submitting your payment…
        </p>
      ) : null}
      <div className="form-actions">
        {onCancel ? (
          <Button variant="outline" type="button" disabled={submitting} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button variant="primary" type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? (
            <>
              <span className="btn-spinner" aria-hidden="true" />
              Submitting…
            </>
          ) : (
            'Submit payment'
          )}
        </Button>
      </div>
    </form>
  );
}
