import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { ServiceError } from '../services/http.js';
import { forgotCustomerPassword } from '../services/customerPassword.js';
import './AuthPage.css';

const SUCCESS_COPY = 'If that email is registered, we sent a link.';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setEmailError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      return;
    }
    try {
      await forgotCustomerPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to send reset link.');
    }
  }

  return (
    <section className="page-block">
      <h1>Forgot password</h1>
      <ErrorMessage>{error}</ErrorMessage>
      {sent ? (
        <p>{SUCCESS_COPY}</p>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
            {emailError ? <p className="field-error">{emailError}</p> : null}
          </div>
          <Button variant="primary" type="submit">
            Send reset link
          </Button>
        </form>
      )}
      <p className="auth-switch">
        <Link to="/login">Back to sign in</Link>
      </p>
    </section>
  );
}
