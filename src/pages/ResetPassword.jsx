import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import {
  resetCustomerPassword,
  signOutAfterPasswordReset,
} from '../services/customerPassword.js';
import { ServiceError } from '../services/http.js';
import './AuthPage.css';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [pageError, setPageError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!token) {
    return <Navigate to="/forgot-password" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setPasswordError(null);
    setConfirmError(null);
    setPageError(null);
    let invalid = false;
    if (password.length < 8) {
      setPasswordError('At least 8 characters.');
      invalid = true;
    }
    if (password !== confirm) {
      setConfirmError('Passwords do not match.');
      invalid = true;
    }
    if (invalid) {
      return;
    }
    try {
      await resetCustomerPassword({ token, password });
      signOutAfterPasswordReset();
      navigate('/login', { state: { notice: 'Password updated. Please sign in.' } });
    } catch (err) {
      if (err instanceof ServiceError && err.status === 400) {
        setPageError('This link is invalid, used, or expired.');
        return;
      }
      setPageError(err instanceof ServiceError ? err.message : 'Unable to reset password.');
    }
  }

  return (
    <section className="page-block">
      <h1>Reset password</h1>
      {pageError ? (
        <div className="confirm-box">
          <ErrorMessage>{pageError}</ErrorMessage>
          <p>
            <Link to="/forgot-password">Request a new link</Link>
          </p>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
            {passwordError ? <p className="field-error">{passwordError}</p> : null}
          </div>
          <div className="form-row">
            <label htmlFor="reset-confirm">Confirm password</label>
            <input
              id="reset-confirm"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              required
            />
            {confirmError ? <p className="field-error">{confirmError}</p> : null}
          </div>
          <Button variant="primary" type="submit">
            Update password
          </Button>
        </form>
      )}
    </section>
  );
}
