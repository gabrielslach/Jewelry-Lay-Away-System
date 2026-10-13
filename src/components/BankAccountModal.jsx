import { useEffect, useRef, useState } from 'react';
import {
  createAdminBankAccount,
  updateAdminBankAccount,
} from '../services/adminBankAccounts.js';
import { ServiceError } from '../services/http.js';
import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import Modal from './Modal.jsx';
import './BankAccountModal.css';
import './Checkout.css';
import '../pages/Account.css';

const TEXT_FIELDS = [
  { key: 'bank_name', label: 'Bank name' },
  { key: 'account_name', label: 'Account name' },
  { key: 'account_number', label: 'Account number' },
];

function FieldError({ children }) {
  return children ? <p className="field-error">{children}</p> : null;
}

export default function BankAccountModal({ account, onClose, onSaved }) {
  const [form, setForm] = useState({
    bank_name: account?.bank_name ?? '',
    account_name: account?.account_name ?? '',
    account_number: account?.account_number ?? '',
  });
  const [chosen, setChosen] = useState(null);
  const [removeQr, setRemoveQr] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const chosenUrlRef = useRef(null);

  useEffect(
    () => () => {
      if (chosenUrlRef.current) {
        URL.revokeObjectURL(chosenUrlRef.current);
      }
    },
    [],
  );

  const savedQr = removeQr ? null : (account?.qr_code_url ?? null);
  const previewUrl = chosen?.url ?? savedQr;

  function clearError(key) {
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function setField(key, value) {
    setForm({ ...form, [key]: value });
    clearError(key);
  }

  function replaceChosen(file) {
    if (chosenUrlRef.current) {
      URL.revokeObjectURL(chosenUrlRef.current);
    }
    chosenUrlRef.current = file ? URL.createObjectURL(file) : null;
    setChosen(file ? { file, url: chosenUrlRef.current } : null);
  }

  function chooseFile(file) {
    replaceChosen(file ?? null);
    setRemoveQr(false);
    clearError('qr_code');
  }

  function removePreview() {
    replaceChosen(null);
    inputRef.current.value = '';
    setRemoveQr(Boolean(account?.qr_code_url));
    clearError('qr_code');
  }

  async function handleSubmit() {
    const found = {};
    TEXT_FIELDS.forEach(({ key, label }) => {
      if (!form[key].trim()) {
        found[key] = `Enter the ${label.toLowerCase()}.`;
      }
    });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) {
      return;
    }
    const payload = {
      bank_name: form.bank_name.trim(),
      account_name: form.account_name.trim(),
      account_number: form.account_number.trim(),
      qrFile: chosen?.file,
      removeQr,
    };
    setSaving(true);
    try {
      const saved = account
        ? await updateAdminBankAccount(account.id, payload)
        : await createAdminBankAccount(payload);
      onSaved(saved);
    } catch (err) {
      setErrors(err instanceof ServiceError ? (err.fields ?? {}) : {});
      setFormError(
        err instanceof ServiceError
          ? err.message
          : 'Unable to save the bank account.',
      );
      setSaving(false);
    }
  }

  return (
    <Modal
      title={account ? 'Edit bank account' : 'Add bank account'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={handleSubmit}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <ErrorMessage>{formError}</ErrorMessage>
      {TEXT_FIELDS.map(({ key, label }) => (
        <div className="form-row" key={key}>
          <label htmlFor={`bank-${key}`}>{label}</label>
          <input
            id={`bank-${key}`}
            value={form[key]}
            aria-invalid={errors[key] ? 'true' : undefined}
            onChange={(event) => setField(key, event.target.value)}
          />
          <FieldError>{errors[key]}</FieldError>
        </div>
      ))}
      <div className="form-row">
        <label htmlFor="bank-qr">QR code</label>
        <input
          id="bank-qr"
          ref={inputRef}
          type="file"
          accept="image/*"
          aria-invalid={errors.qr_code ? 'true' : undefined}
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        <p className="field-hint">PNG or JPG. Optional.</p>
        {previewUrl ? (
          <div className="qr-preview">
            <img src={previewUrl} alt="QR code preview" />
            <button type="button" className="text-link" onClick={removePreview}>
              Remove QR
            </button>
          </div>
        ) : null}
        <FieldError>{errors.qr_code}</FieldError>
      </div>
    </Modal>
  );
}
