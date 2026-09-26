import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { useToast } from '../../components/useToast.js';
import { ServiceError } from '../../services/http.js';
import { getAdminSettings } from '../../services/getAdminSettings.js';
import { putAdminSettings } from '../../services/putAdminSettings.js';
import '../../components/Checkout.css';

export default function Settings() {
  const { showToast } = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAdminSettings()
      .then(setForm)
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load settings.');
      });
  }, []);

  function toggle(key) {
    setForm((current) => ({ ...current, [key]: !current[key] }));
  }

  async function handleSave() {
    try {
      await putAdminSettings(form);
      showToast('Settings saved.');
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to save settings.');
    }
  }

  if (!form) {
    return error ? <ErrorMessage>{error}</ErrorMessage> : <p>Loading…</p>;
  }

  return (
    <div className="panel settings-form">
      <h2>Business Settings</h2>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="form-row">
        <label htmlFor="biz-name">Business Name</label>
        <input
          id="biz-name"
          value={form.business_name}
          onChange={(event) => setForm({ ...form, business_name: event.target.value })}
        />
      </div>
      <div className="form-row">
        <label htmlFor="max-term">Maximum Lay-Away Term (Months)</label>
        <input
          id="max-term"
          value={form.max_term_months}
          onChange={(event) => setForm({ ...form, max_term_months: Number(event.target.value) })}
        />
      </div>
      <div className="form-row">
        <label htmlFor="penalty">Late Payment Penalty (per day)</label>
        <input
          id="penalty"
          value={`₱${form.late_penalty_per_day}`}
          onChange={(event) =>
            setForm({
              ...form,
              late_penalty_per_day: Number(String(event.target.value).replace(/[^\d]/g, '')),
            })
          }
        />
      </div>
      <div className="toggle-row">
        <span>Require full payment before item release</span>
        <div
          className={form.require_full_payment_before_release ? 'switch on' : 'switch'}
          role="switch"
          aria-checked={form.require_full_payment_before_release}
          tabIndex={0}
          onClick={() => toggle('require_full_payment_before_release')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              toggle('require_full_payment_before_release');
            }
          }}
        />
      </div>
      <div className="toggle-row">
        <span>Send SMS payment reminders</span>
        <div
          className={form.sms_reminders ? 'switch on' : 'switch'}
          role="switch"
          aria-checked={form.sms_reminders}
          tabIndex={0}
          onClick={() => toggle('sms_reminders')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              toggle('sms_reminders');
            }
          }}
        />
      </div>
      <div className="toggle-row">
        <span>Allow customer-selected due dates</span>
        <div
          className={form.customer_selected_due_dates ? 'switch on' : 'switch'}
          role="switch"
          aria-checked={form.customer_selected_due_dates}
          tabIndex={0}
          onClick={() => toggle('customer_selected_due_dates')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              toggle('customer_selected_due_dates');
            }
          }}
        />
      </div>
      <div style={{ marginTop: 18 }}>
        <Button variant="primary" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
