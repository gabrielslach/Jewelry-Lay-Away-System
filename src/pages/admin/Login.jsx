import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { adminReturnPath } from '../../lib/returnPath.js';
import { ServiceError } from '../../services/http.js';
import { loginAdmin } from '../../services/loginAdmin.js';
import { getAdminRefreshToken } from '../../services/session.js';
import '../AuthPage.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromParam = new URLSearchParams(location.search).get('from');
  const from = adminReturnPath(fromParam);
  const [email, setEmail] = useState('admin@samplejewelry.example');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (getAdminRefreshToken()) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      await loginAdmin({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to sign in.');
    }
  }

  return (
    <section className="page-block admin-login">
      <h1>Admin sign in</h1>
      <p className="page-lead">Sign in with your staff account to manage lay-aways.</p>
      <ErrorMessage>{error}</ErrorMessage>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="admin-login-email">Email</label>
          <input
            id="admin-login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="admin-login-password">Password</label>
          <input
            id="admin-login-password"
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
    </section>
  );
}
