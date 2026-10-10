import { Navigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import ChangePasswordForm from '../components/ChangePasswordForm.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import LayawayPlanCard from '../components/LayawayPlanCard.jsx';
import Skeleton, {
  AccountActiveSkeleton,
  AccountCompletedSkeleton,
  Bone,
} from '../components/Skeleton.jsx';
import { useSession } from '../components/useSession.js';
import { ServiceError } from '../services/http.js';
import { getCustomerOrders } from '../services/getCustomerOrders.js';
import { changeCustomerPassword } from '../services/customerPassword.js';
import { getCustomerNotifications } from '../services/customerNotifications.js';
import { logoutCustomer } from '../services/logoutCustomer.js';
import './Account.css';
import './AuthPage.css';
import '../components/Checkout.css';
import '../components/PieceDetail.css';

export default function Account() {
  const { customer } = useSession();
  const [orders, setOrders] = useState({ active: [], completed: [] });
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);
  const [rejections, setRejections] = useState({});

  const loadOrders = useCallback(() => {
    return getCustomerOrders()
      .then((data) => {
        setOrders(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load your account.');
      })
      .finally(() => setLoadingOrders(false));
  }, []);

  useEffect(() => {
    if (!customer) {
      return undefined;
    }
    let cancelled = false;
    getCustomerOrders()
      .then((data) => {
        if (!cancelled) {
          setOrders(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ServiceError ? err.message : 'Unable to load your account.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingOrders(false);
        }
      });
    getCustomerNotifications()
      .then((data) => {
        if (cancelled) {
          return;
        }
        const map = {};
        (data.items ?? [])
          .filter((item) => item.kind === 'payment_rejected')
          .forEach((item) => {
            if (item.payment_id) {
              map[item.payment_id] = item.body;
            }
          });
        setRejections(map);
      })
      .catch(() => {
        if (!cancelled) {
          setRejections({});
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
        <button type="button" className="text-link" onClick={logoutCustomer}>
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
          {loadingOrders ? (
            <Bone className="skeleton-bone-count" />
          ) : (
            <b>{orders.active.length}</b>
          )}
        </div>
        <div className="spec-item">
          <span>Member Since</span>
          <b>{customer.member_since}</b>
        </div>
      </div>
      <ChangePasswordForm
        onSubmit={({ currentPassword, newPassword }) =>
          changeCustomerPassword({
            currentPassword,
            newPassword,
          })
        }
      />
      <h2>Active Lay-Aways</h2>
      {loadingOrders ? (
        <Skeleton>
          <AccountActiveSkeleton />
        </Skeleton>
      ) : orders.active.length ? (
        orders.active.map((plan) => (
          <LayawayPlanCard
            key={plan.id}
            plan={plan}
            rejectionByPaymentId={rejections}
            onUpdated={loadOrders}
          />
        ))
      ) : (
        <p className="empty-copy">No active lay-aways right now.</p>
      )}
      <h2>Completed Lay-Aways</h2>
      {loadingOrders ? (
        <Skeleton>
          <AccountCompletedSkeleton />
        </Skeleton>
      ) : orders.completed.length ? (
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
