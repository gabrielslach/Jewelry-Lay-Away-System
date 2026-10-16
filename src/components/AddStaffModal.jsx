import { useState } from 'react';
import { ServiceError } from '../services/http.js';
import { createAdminStaff } from '../services/createAdminStaff.js';
import { MIN_PASSWORD_LENGTH, STAFF_ROLES } from '../lib/staffRoles.js';
import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import Modal from './Modal.jsx';
import StaffRoleSelect from './StaffRoleSelect.jsx';
import './Checkout.css';
import '../pages/AuthPage.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ name, email, password }) {
  const errors = {};
  if (!name.trim()) {
    errors.name = 'Enter a name.';
  }
  if (!email.trim()) {
    errors.email = 'Enter an email.';
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Enter a valid email.';
  }
  if (!password) {
    errors.password = 'Enter a password.';
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = 'At least 8 characters.';
  }
  return errors;
}

export default function AddStaffModal({ full, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: STAFF_ROLES.find((role) => !full.includes(role)) ?? 'accounting',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const setField = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  async function handleSubmit() {
    const found = validate(form);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSaving(true);
    try {
      await createAdminStaff({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
      });
      onSaved();
    } catch (err) {
      setFormError(err instanceof ServiceError ? err.message : 'Unable to add staff.');
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Add staff"
      onClose={handleClose}
      footer={
        <>
          <Button variant="outline" disabled={saving} onClick={handleClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={handleSubmit}>
            {saving ? 'Adding…' : 'Add staff'}
          </Button>
        </>
      }
    >
      <div className="form-row">
        <label htmlFor="staff-name">Name</label>
        <input id="staff-name" value={form.name} onChange={setField('name')} />
        {errors.name ? <p className="field-error">{errors.name}</p> : null}
      </div>
      <div className="form-row">
        <label htmlFor="staff-email">Email</label>
        <input id="staff-email" type="email" value={form.email} onChange={setField('email')} />
        {errors.email ? <p className="field-error">{errors.email}</p> : null}
      </div>
      <div className="form-row">
        <label htmlFor="staff-password">Password</label>
        <input
          id="staff-password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={setField('password')}
        />
        <p className="field-hint">At least 8 characters.</p>
        {errors.password ? <p className="field-error">{errors.password}</p> : null}
      </div>
      <StaffRoleSelect
        value={form.role}
        full={full}
        onChange={(role) => setForm({ ...form, role })}
      />
      <ErrorMessage>{formError}</ErrorMessage>
    </Modal>
  );
}
