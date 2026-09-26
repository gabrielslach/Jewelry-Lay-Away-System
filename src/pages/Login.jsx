import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { useSession } from '../components/useSession.js';
import { ServiceError } from '../services/http.js';
import { loginCustomer } from '../services/loginCustomer.js';
import './AuthPage.css';

export default function Login() {
  const { signIn, customer } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const from = new URLSearchParams(location.search).get('from') || '/account';
  const [email, setEmail] = useState('client@sampleemail.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState(null);

  if (customer) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      const data = await loginCustomer({ email, password });
      signIn(data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to sign in.');
    }
  }

  return (
    <section className="page-block">
      <h1>Sign in</h1>
      <p className="page-lead">Access your lay-away plans with your customer account.</p>
      <ErrorMessage>{error}</ErrorMessage>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <Button variant="primary" type="submit">
          Sign in
        </Button>
      </form>
      <p className="auth-switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </section>
  );
}
