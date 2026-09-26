import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { useSession } from '../components/useSession.js';
import { returnPath } from '../lib/returnPath.js';
import { ServiceError } from '../services/http.js';
import { loginCustomer } from '../services/loginCustomer.js';
import './AuthPage.css';

export default function Login() {
  const { customer } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const fromParam = new URLSearchParams(location.search).get('from');
  const from = returnPath(fromParam);
  const [email, setEmail] = useState('client@sampleemail.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (customer) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      await loginCustomer({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to sign in.');
    }
  }

  const registerTo = fromParam ? `/register?from=${encodeURIComponent(from)}` : '/register';

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
        New here? <Link to={registerTo}>Create an account</Link>
      </p>
    </section>
  );
}
