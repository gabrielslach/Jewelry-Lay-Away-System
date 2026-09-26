import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { useSession } from '../components/useSession.js';
import { ServiceError } from '../services/http.js';
import { registerCustomer } from '../services/registerCustomer.js';
import './AuthPage.css';

export default function Register() {
  const { signIn, customer } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);

  if (customer) {
    return <Navigate to="/account" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const data = await registerCustomer({ name, email, password });
      signIn(data);
      navigate('/account', { replace: true });
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to register.');
    }
  }

  return (
    <section className="page-block">
      <h1>Create an account</h1>
      <p className="page-lead">Register to reserve pieces and track your lay-away plans.</p>
      <ErrorMessage>{error}</ErrorMessage>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="reg-name">Name</label>
          <input
            id="reg-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="reg-confirm">Confirm password</label>
          <input
            id="reg-confirm"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <Button variant="primary" type="submit">
          Register
        </Button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </section>
  );
}
