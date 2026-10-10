import { useState } from 'react';
import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import { ServiceError } from '../services/http.js';
import { useToast } from './useToast.js';

export default function ChangePasswordForm({
  onSubmit,
  onSuccess,
  heading = 'Change password',
}) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentError, setCurrentError] = useState(null);
  const [newError, setNewError] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [formError, setFormError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setCurrentError(null);
    setNewError(null);
    setConfirmError(null);
    setFormError(null);

    let invalid = false;
    if (newPassword.length < 8) {
      setNewError('At least 8 characters.');
      invalid = true;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      invalid = true;
    }
    if (invalid) {
      return;
    }

    try {
      await onSubmit({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed.');
      onSuccess?.();
    } catch (err) {
      if (!(err instanceof ServiceError)) {
        setFormError('Unable to change password.');
        return;
      }
      if (err.status === 401) {
        setCurrentError('Current password is incorrect.');
        return;
      }
      if (err.status === 400) {
        setNewError(err.message);
        return;
      }
      setFormError(err.message);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {heading ? <h2>{heading}</h2> : null}
      <ErrorMessage>{formError}</ErrorMessage>
      <div className="form-row">
        <label htmlFor="current-password">Current password</label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
        {currentError ? <p className="field-error">{currentError}</p> : null}
      </div>
      <div className="form-row">
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />
        {newError ? <p className="field-error">{newError}</p> : null}
      </div>
      <div className="form-row">
        <label htmlFor="confirm-password">Confirm password</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        {confirmError ? <p className="field-error">{confirmError}</p> : null}
      </div>
      <Button variant="primary" type="submit">
        Change password
      </Button>
    </form>
  );
}
