import { useState } from 'react';
import { ServiceError } from '../services/http.js';
import { updateAdminStaff } from '../services/updateAdminStaff.js';
import { MIN_PASSWORD_LENGTH } from '../lib/staffRoles.js';
import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import Modal from './Modal.jsx';
import SettingsSwitch from './SettingsSwitch.jsx';
import StaffRoleSelect from './StaffRoleSelect.jsx';
import './Checkout.css';
import '../pages/AuthPage.css';

const SELF_HINT = "You can't change your own role.";
const LAST_ADMIN_HINT =
  "This is the last active admin, so they can't be demoted or deactivated.";

function reactivationHint(role) {
  return role === 'admin'
    ? 'Admin limit reached. Deactivate another admin first.'
    : 'Accounting limit reached. Deactivate another accounting user first.';
}

function changedFields(member, form) {
  const changes = {};
  if (form.name.trim() !== member.name) {
    changes.name = form.name.trim();
  }
  if (form.role !== member.role) {
    changes.role = form.role;
  }
  if (form.is_active !== member.is_active) {
    changes.is_active = form.is_active;
  }
  if (form.password) {
    changes.password = form.password;
  }
  return changes;
}

export default function EditStaffModal({ member, isSelf, isLastAdmin, full, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: member.name,
    role: member.role,
    is_active: member.is_active,
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const changes = changedFields(member, form);
  const locked = isSelf || isLastAdmin;
  const lockedHint = isSelf ? SELF_HINT : LAST_ADMIN_HINT;
  const reactivationBlocked = !member.is_active && full.includes(form.role);

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  async function handleSubmit() {
    const found = {};
    if (!form.name.trim()) {
      found.name = 'Enter a name.';
    }
    if (form.password && form.password.length < MIN_PASSWORD_LENGTH) {
      found.password = 'At least 8 characters.';
    }
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSaving(true);
    try {
      const saved = await updateAdminStaff(member.id, changes);
      onSaved(saved);
    } catch (err) {
      setFormError(err instanceof ServiceError ? err.message : 'Unable to update staff.');
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Edit staff"
      onClose={handleClose}
      footer={
        <>
          <Button variant="outline" disabled={saving} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={saving || Object.keys(changes).length === 0}
            onClick={handleSubmit}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <p className="field-hint">{member.email}</p>
      <div className="form-row">
        <label htmlFor="staff-name">Name</label>
        <input
          id="staff-name"
          value={form.name}
          required
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        {errors.name ? <p className="field-error">{errors.name}</p> : null}
      </div>
      <StaffRoleSelect
        value={form.role}
        full={full}
        keepRole={member.role}
        disabled={locked}
        lockedHint={locked ? lockedHint : null}
        onChange={(role) => setForm({ ...form, role })}
      />
      {isSelf ? null : (
        <>
          <SettingsSwitch
            id="staff-active"
            label="Active"
            checked={form.is_active}
            disabled={locked || reactivationBlocked}
            onToggle={() => setForm({ ...form, is_active: !form.is_active })}
          />
          {reactivationBlocked && !locked ? (
            <p className="field-hint">{reactivationHint(form.role)}</p>
          ) : null}
        </>
      )}
      <hr />
      <h4>Reset password</h4>
      <div className="form-row">
        <label htmlFor="staff-new-password">New password</label>
        <input
          id="staff-new-password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <p className="field-hint">
          At least 8 characters. They will be signed out everywhere.
        </p>
        {errors.password ? <p className="field-error">{errors.password}</p> : null}
      </div>
      <ErrorMessage>{formError}</ErrorMessage>
    </Modal>
  );
}
