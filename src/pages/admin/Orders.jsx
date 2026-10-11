import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Skeleton, { OrdersTableSkeleton } from '../../components/Skeleton.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/useToast.js';
import { formatDisplayDate } from '../../lib/dates.js';
import { ServiceError } from '../../services/http.js';
import { getAdminPlans } from '../../services/getAdminPlans.js';
import { getLayawayPlan } from '../../services/getLayawayPlan.js';
import { cancelReservation, retryReservation } from '../../services/adminReservations.js';
import { getAdminSession } from '../../services/session.js';
import '../Account.css';
import '../../components/Checkout.css';

const RESERVATION_LABELS = {
  waiting_for_stock: 'Waiting for stock',
  reserved: 'Reserved',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function isAdminRole() {
  return (getAdminSession()?.admin?.role ?? 'admin') === 'admin';
}

async function withDetail(plan) {
  const detail = await getLayawayPlan(plan.id);
  return { ...plan, installments: detail.installments ?? [] };
}

export default function Orders() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const openPlanId = useRef(searchParams.get('plan'));
  const viewRequest = useRef(0);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [handoffConfirmed, setHandoffConfirmed] = useState(false);
  const [cancelErrors, setCancelErrors] = useState({});
  const admin = isAdminRole();

  async function loadDetail(plan) {
    try {
      return await withDetail(plan);
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to load order details.');
      return null;
    }
  }

  function refreshPlans(activeId = null) {
    return getAdminPlans()
      .then(async (data) => {
        setPlans(data);
        setError(null);
        const fresh = data.find((plan) => plan.id === activeId);
        if (!fresh) {
          setActive(null);
          return;
        }
        const detailed = await loadDetail(fresh);
        if (detailed) {
          setActive(detailed);
        }
      })
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load orders.');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    getAdminPlans()
      .then(async (data) => {
        setPlans(data);
        const planId = openPlanId.current;
        openPlanId.current = null;
        const fromQuery = planId ? data.find((plan) => String(plan.id) === String(planId)) : null;
        if (!fromQuery) {
          return;
        }
        const detailed = await loadDetail(fromQuery);
        if (detailed) {
          setActive(detailed);
        }
        setSearchParams(
          (current) => {
            if (!current.has('plan')) {
              return current;
            }
            const next = new URLSearchParams(current);
            next.delete('plan');
            return next;
          },
          { replace: true },
        );
      })
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load orders.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setSearchParams]);

  const rows = plans.filter((plan) => filter === 'all' || plan.status === filter);

  async function handleView(plan) {
    const requestId = ++viewRequest.current;
    const detailed = await loadDetail(plan);
    if (detailed && requestId === viewRequest.current) {
      setError(null);
      setActive(detailed);
    }
  }

  async function handleRetry() {
    try {
      const result = await retryReservation(active.id);
      showToast(
        result.state
          ? `Reservation updated: ${RESERVATION_LABELS[result.state] ?? result.state}.`
          : 'Reservation retry sent.',
      );
      refreshPlans(active.id);
    } catch (err) {
      if (err instanceof ServiceError && err.status === 409) {
        setError(err.message);
        refreshPlans(active.id);
        return;
      }
      setError(err instanceof ServiceError ? err.message : 'Unable to retry reservation.');
    }
  }

  async function handleCancel() {
    const nextErrors = {};
    if (!cancelReason.trim()) {
      nextErrors.reason = 'A reason is required.';
    }
    if (!handoffConfirmed) {
      nextErrors.handoff = 'Confirm the handoff with the customer.';
    }
    if (Object.keys(nextErrors).length) {
      setCancelErrors(nextErrors);
      return;
    }
    try {
      await cancelReservation(active.id, {
        reason: cancelReason.trim(),
        handoffConfirmed: true,
      });
      showToast('Reservation cancelled.');
      setCancelOpen(false);
      setCancelReason('');
      setHandoffConfirmed(false);
      setCancelErrors({});
      setActive(null);
      refreshPlans();
    } catch (err) {
      if (err instanceof ServiceError && err.status === 400) {
        setCancelErrors({ form: err.message });
        return;
      }
      setError(err instanceof ServiceError ? err.message : 'Unable to cancel reservation.');
    }
  }

  function reservationBadge(status) {
    const label = RESERVATION_LABELS[status];
    if (!label) {
      return null;
    }
    return (
      <span className={status === 'waiting_for_stock' ? 'badge badge-warn' : 'badge badge-ok'}>
        {label}
      </span>
    );
  }

  return (
    <div className="panel">
      <ErrorMessage>{error}</ErrorMessage>
      <div className="filter-row">
        {[
          { id: 'all', label: 'All' },
          { id: 'ok', label: 'On Track' },
          { id: 'warn', label: 'Overdue' },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            className={filter === option.id ? 'filter-btn active' : 'filter-btn'}
            aria-pressed={filter === option.id}
            aria-label={`Show ${option.label} orders`}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="table-wrap">
        {loading && plans.length === 0 ? (
          <Skeleton>
            <OrdersTableSkeleton />
          </Skeleton>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Item</th>
                <th>Plan</th>
                <th>Next Due</th>
                <th>Status</th>
                <th>Hold</th>
                <th> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <b>{plan.id}</b>
                  </td>
                  <td>{plan.customer_name}</td>
                  <td>{plan.item_name}</td>
                  <td>{plan.plan_label}</td>
                  <td>{plan.next_due}</td>
                  <td>
                    <span className={plan.status === 'ok' ? 'badge badge-ok' : 'badge badge-warn'}>
                      {plan.status === 'ok' ? 'On Track' : 'Overdue'}
                    </span>
                  </td>
                  <td>{reservationBadge(plan.reservation_status)}</td>
                  <td>
                    <Button variant="outline" size="sm" onClick={() => handleView(plan)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {active ? (
        <Modal
          title={`Order #${active.id}`}
          onClose={() => setActive(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setActive(null)}>
                Close
              </Button>
              {active.reservation_error || active.reservation_status === 'waiting_for_stock' ? (
                <Button variant="primary" onClick={handleRetry} disabled={!admin}>
                  Retry
                </Button>
              ) : null}
              {active.reservation_status === 'reserved' ||
              active.reservation_status === 'waiting_for_stock' ? (
                <Button variant="outline" onClick={() => setCancelOpen(true)} disabled={!admin}>
                  Cancel reservation
                </Button>
              ) : null}
            </>
          }
        >
          <div className="spec-grid">
            <div className="spec-item">
              <span>Customer</span>
              <b>{active.customer_name}</b>
            </div>
            <div className="spec-item">
              <span>Item</span>
              <b>{active.item_name}</b>
            </div>
            <div className="spec-item">
              <span>Plan</span>
              <b>{active.plan_label}</b>
            </div>
            <div className="spec-item">
              <span>Status</span>
              <span className={active.status === 'ok' ? 'badge badge-ok' : 'badge badge-warn'}>
                {active.status === 'ok' ? 'On Track' : 'Overdue'}
              </span>
            </div>
            {active.reservation_status && active.reservation_status !== 'none' ? (
              <div className="spec-item">
                <span>Reservation</span>
                {reservationBadge(active.reservation_status) ?? <b>{active.reservation_status}</b>}
              </div>
            ) : null}
            {active.down_payment_confirmed_at ? (
              <div className="spec-item">
                <span>Down payment confirmed</span>
                <b>{formatDisplayDate(active.down_payment_confirmed_at)}</b>
              </div>
            ) : null}
          </div>
          {active.reservation_error ? (
            <p className="plan-notice">
              <b>Reservation error</b>
              <br />
              {active.reservation_error}
            </p>
          ) : null}
          <div className="schedule-list">
            {active.installments.map((row, index) => (
              <div className="schedule-row" key={row.id}>
                <b>
                  Payment {row.term_number ?? index + 1} of {active.installments.length}
                </b>
                <span>₱{Number(row.amount).toLocaleString('en-US')}</span>
                <span
                  className={
                    row.status === 'paid'
                      ? 'badge badge-ok'
                      : row.status === 'overdue'
                        ? 'badge badge-warn'
                        : row.status === 'submitted' || row.status === 'awaiting_confirmation'
                          ? 'badge badge-info'
                          : 'badge badge-mute'
                  }
                >
                  {row.status === 'paid'
                    ? 'Paid'
                    : row.status === 'overdue'
                      ? 'Overdue'
                      : row.status === 'submitted' || row.status === 'awaiting_confirmation'
                        ? 'Awaiting confirmation'
                        : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}

      {cancelOpen && active ? (
        <Modal
          title="Cancel reservation"
          onClose={() => {
            setCancelOpen(false);
            setCancelErrors({});
          }}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setCancelOpen(false);
                  setCancelErrors({});
                }}
              >
                Close
              </Button>
              <Button variant="primary" onClick={handleCancel} disabled={!admin}>
                Cancel reservation
              </Button>
            </>
          }
        >
          <ErrorMessage>{cancelErrors.form}</ErrorMessage>
          <div className="form-row">
            <label htmlFor="cancel-reason">Reason</label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
            />
            {cancelErrors.reason ? <p className="field-error">{cancelErrors.reason}</p> : null}
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={handoffConfirmed}
              onChange={(event) => setHandoffConfirmed(event.target.checked)}
            />
            <span>Termination handed off and agreed with the customer</span>
          </label>
          {cancelErrors.handoff ? <p className="field-error">{cancelErrors.handoff}</p> : null}
        </Modal>
      ) : null}
    </div>
  );
}
