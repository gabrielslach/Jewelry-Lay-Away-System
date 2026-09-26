import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { useSession } from '../components/useSession.js';
import { ServiceError } from '../services/http.js';
import { getCustomerOrders } from '../services/getCustomerOrders.js';
import './Account.css';
import './AuthPage.css';
import '../components/Checkout.css';
import '../components/PieceDetail.css';

function badgeClass(status) {
  return status === 'ok' ? 'badge badge-ok' : 'badge badge-warn';
}

function badgeLabel(status) {
  return status === 'ok' ? 'On Track' : 'Overdue';
}

export default function Account() {
  const { customer, signOut } = useSession();
  const [orders, setOrders] = useState({ active: [], completed: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!customer) {
      return undefined;
    }
    let cancelled = false;
    getCustomerOrders(customer.id)
      .then((data) => {
        if (!cancelled) {
          setOrders(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ServiceError ? err.message : 'Unable to load your account.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [customer]);

  if (!customer) {
    return <Navigate to="/login?from=/account" replace />;
  }

  return (
    <section className="page-block">
      <div className="account-head">
        <h1>My Account</h1>
        <button type="button" className="text-link" onClick={signOut}>
          Sign out
        </button>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="spec-grid">
        <div className="spec-item">
          <span>Name</span>
          <b>{customer.name}</b>
        </div>
        <div className="spec-item">
          <span>Email</span>
          <b>{customer.email}</b>
        </div>
        <div className="spec-item">
          <span>Active Lay-Aways</span>
          <b>{orders.active.length}</b>
        </div>
        <div className="spec-item">
          <span>Member Since</span>
          <b>{customer.member_since}</b>
        </div>
      </div>
      <h2>Active Lay-Aways</h2>
      {orders.active.length ? (
        orders.active.map((plan) => (
          <div className="plan-box" key={plan.id}>
            <h3 className="plan-title">
              <span>{plan.item_name}</span>
              <span className={badgeClass(plan.status)}>{badgeLabel(plan.status)}</span>
            </h3>
            <p className="plan-meta">
              {plan.plan_label} · Order #{plan.id} · Next Due {plan.next_due}
            </p>
            <div className="schedule-list">
              {plan.installments.map((row, index) => (
                <div className="schedule-row" key={row.id}>
                  <b>
                    Payment {index + 1} of {plan.installments.length}
                  </b>
                  <span>₱{Number(row.amount).toLocaleString('en-US')}</span>
                  <span className={row.status === 'paid' ? 'badge badge-ok' : 'badge badge-warn'}>
                    {row.status === 'paid' ? 'Paid' : row.status === 'overdue' ? 'Overdue' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className="empty-copy">No active lay-aways right now.</p>
      )}
      <h2>Completed Lay-Aways</h2>
      {orders.completed.length ? (
        orders.completed.map((plan) => (
          <div className="schedule-row" key={plan.id}>
            <span>{plan.item_name}</span>
            <span>{plan.plan_label}</span>
            <span className="badge badge-ok">Completed {plan.completed_on}</span>
          </div>
        ))
      ) : (
        <p className="empty-copy">No completed lay-aways yet.</p>
      )}
    </section>
  );
}
