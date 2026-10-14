import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import ChangePasswordModal from '../../components/ChangePasswordModal.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import SettingsSwitch from '../../components/SettingsSwitch.jsx';
import Skeleton, { SettingsSkeleton } from '../../components/Skeleton.jsx';
import { useToast } from '../../components/useToast.js';
import { ServiceError } from '../../services/http.js';
import { changeAdminPassword } from '../../services/adminPassword.js';
import { getAdminSettings } from '../../services/getAdminSettings.js';
import { putAdminSettings } from '../../services/putAdminSettings.js';
import { getAdminSession } from '../../services/session.js';
import '../../components/Checkout.css';
import '../AuthPage.css';

export default function Settings() {
  const { showToast } = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const isAdmin = (getAdminSession()?.admin?.role ?? 'admin') === 'admin';

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
    return (
      <div className="panel settings-form">
        <h2>Business Settings</h2>
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        {!error ? (
          <Skeleton>
            <SettingsSkeleton />
          </Skeleton>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="panel settings-form">
        <h2>Business Settings</h2>
        <ErrorMessage>{error}</ErrorMessage>
        {!isAdmin ? (
          <p className="page-lead">
            Only admins can change settings. The switch is shown disabled for this role.
          </p>
        ) : null}
        <div className="form-row">
          <label htmlFor="max-term">Maximum Lay-Away Term (Months)</label>
          <input
            id="max-term"
            value={form.max_term_months}
            disabled={!isAdmin}
            onChange={(event) =>
              setForm({ ...form, max_term_months: Number(event.target.value) })
            }
          />
        </div>
        <SettingsSwitch
          id="setting-notify-accounting"
          label="Also send alerts to accounting accounts"
          checked={Boolean(form.notify_accounting_roles)}
          disabled={!isAdmin}
          onToggle={() => toggle('notify_accounting_roles')}
        />
        <p className="field-hint">
          Admins always receive alerts. Turn this on to include accounting accounts, by
          email and in their bell.
        </p>
        <div style={{ marginTop: 18 }}>
          <Button variant="primary" onClick={handleSave} disabled={!isAdmin}>
            Save Changes
          </Button>
        </div>
      </div>
      <div className="panel">
        <ChangePasswordModal
          onSubmit={({ currentPassword, newPassword }) =>
            changeAdminPassword({
              currentPassword,
              newPassword,
            })
          }
        />
      </div>
    </>
  );
}
