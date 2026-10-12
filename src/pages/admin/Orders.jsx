import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/Button.jsx';
import DataTable from '../../components/DataTable.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Skeleton, { OrdersTableSkeleton } from '../../components/Skeleton.jsx';
import InstallmentSchedule from '../../components/InstallmentSchedule.jsx';
import Modal from '../../components/Modal.jsx';
import PlanStatusBadge from '../../components/PlanStatusBadge.jsx';
import ReservationBadge, {
  RESERVATION_LABELS,
} from '../../components/ReservationBadge.jsx';
import { useToast } from '../../components/useToast.js';
import { formatDisplayDate } from '../../lib/dates.js';
import { PLAN_STATUSES } from '../../lib/planStatuses.js';
import { ServiceError } from '../../services/http.js';
import { getAdminPlans } from '../../services/getAdminPlans.js';
import { idNumber, sortByValue } from '../../lib/tableSort.js';
import { planTotals } from '../../lib/planTotals.js';
import { getLayawayPlan } from '../../services/getLayawayPlan.js';
import {
  cancelReservation,
  retryReservation,
} from '../../services/adminReservations.js';
import { getAdminSession } from '../../services/session.js';
import '../Account.css';
import '../../components/Checkout.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  ...Object.entries(PLAN_STATUSES)
    .filter(([id]) => id !== 'active')
    .map(([id, { label }]) => ({ id, label })),
];

function peso(value) {
  const amount = Number(value);
  return value == null || value === '' || Number.isNaN(amount)
    ? '—'
    : `₱${amount.toLocaleString('en-US')}`;
}

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

  const loadDetail = useCallback(async (plan) => {
    try {
      return await withDetail(plan);
    } catch (err) {
      setError(
        err instanceof ServiceError
          ? err.message
          : 'Unable to load order details.',
      );
      return null;
    }
  }, []);

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
        setError(
          err instanceof ServiceError ? err.message : 'Unable to load orders.',
        );
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
        const fromQuery = planId
          ? data.find((plan) => String(plan.id) === String(planId))
          : null;
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
        setError(
          err instanceof ServiceError ? err.message : 'Unable to load orders.',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setSearchParams, loadDetail]);

  const rows = useMemo(
    () =>
      plans.filter(
        (plan) =>
          filter === 'all' ||
          plan.status === filter ||
          (filter === 'on_track' && plan.status === 'active'),
      ),
    [plans, filter],
  );

  const handleView = useCallback(
    async (plan) => {
      const requestId = ++viewRequest.current;
      const detailed = await loadDetail(plan);
      if (detailed && requestId === viewRequest.current) {
        setError(null);
        setActive(detailed);
      }
    },
    [loadDetail],
  );

  const columns = useMemo(
    () => [
      {
        id: 'order',
        header: 'Order',
        accessorFn: (plan) => String(plan.id),
        sortingFn: sortByValue((plan) => idNumber(plan.id)),
        cell: ({ row }) => <b>{row.original.id}</b>,
      },
      {
        id: 'customer',
        header: 'Customer',
        accessorFn: (plan) => plan.customer_name,
        cell: ({ row }) => row.original.customer_name,
      },
      {
        id: 'item',
        header: 'Item',
        accessorFn: (plan) => plan.item_name,
        cell: ({ row }) => row.original.item_name,
      },
      {
        id: 'total',
        header: 'Total',
        accessorFn: (plan) => peso(plan.total_price),
        sortingFn: sortByValue((plan) => Number(plan.total_price)),
        cell: ({ row }) => peso(row.original.total_price),
      },
      {
        id: 'next_due',
        header: 'Next Due',
        accessorFn: (plan) => plan.next_due || undefined,
        filterFn: 'includesString',
        sortUndefined: 'last',
        sortingFn: sortByValue((plan) => plan.next_due_date),
        cell: ({ row }) => row.original.next_due,
      },
      {
        id: 'plan_status',
        header: 'Plan Status',
        accessorFn: (plan) => PLAN_STATUSES[plan.status]?.label ?? plan.status,
        cell: ({ row }) => <PlanStatusBadge status={row.original.status} />,
      },
      {
        id: 'reservation_status',
        header: 'Reservation Status',
        accessorFn: (plan) => RESERVATION_LABELS[plan.reservation_status] ?? '',
        cell: ({ row }) => <ReservationBadge status={row.original.reservation_status} />,
      },
      {
        id: 'actions',
        header: ' ',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => handleView(row.original)}>
            View
          </Button>
        ),
      },
    ],
    [handleView],
  );

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
      setError(
        err instanceof ServiceError
          ? err.message
          : 'Unable to retry reservation.',
      );
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
      setError(
        err instanceof ServiceError
          ? err.message
          : 'Unable to cancel reservation.',
      );
    }
  }

  return (
    <div className="panel">
      <ErrorMessage>{error}</ErrorMessage>
      <div className="filter-row">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={
              filter === option.id ? 'filter-btn active' : 'filter-btn'
            }
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
          <DataTable columns={columns} data={rows} getRowId={(plan) => String(plan.id)} />
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
              {active.reservation_error ||
              active.reservation_status === 'waiting_for_stock' ? (
                <Button
                  variant="primary"
                  onClick={handleRetry}
                  disabled={!admin}
                >
                  Retry
                </Button>
              ) : null}
              {active.reservation_status === 'reserved' ||
              active.reservation_status === 'waiting_for_stock' ? (
                <Button
                  variant="outline"
                  onClick={() => setCancelOpen(true)}
                  disabled={!admin}
                >
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
              <span>Status</span>
              <PlanStatusBadge status={active.status} />
            </div>
            {active.reservation_status &&
            active.reservation_status !== 'none' ? (
              <div className="spec-item">
                <span>Reservation</span>
                <ReservationBadge status={active.reservation_status} />
              </div>
            ) : null}
            {active.down_payment_confirmed_at ? (
              <div className="spec-item">
                <span>Down payment confirmed</span>
                <b>{formatDisplayDate(active.down_payment_confirmed_at)}</b>
              </div>
            ) : null}
            <div className="spec-item">
              <span>Created</span>
              <b>{formatDisplayDate(active.created_at) || '—'}</b>
            </div>
            <div className="spec-item">
              <span>Total amount</span>
              <b>{peso(active.total_price)}</b>
            </div>
            <div className="spec-item">
              <span>Financed amount</span>
              <b>{peso(planTotals(active).financedPrincipal)}</b>
            </div>
            <div className="spec-item">
              <span>Down payment</span>
              <b>{peso(active.down_payment_amount)}</b>
            </div>
          </div>
          {active.reservation_error ? (
            <p className="plan-notice">
              <b>Reservation error</b>
              <br />
              {active.reservation_error}
            </p>
          ) : null}
          <InstallmentSchedule installments={active.installments} />
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
              <Button
                variant="primary"
                onClick={handleCancel}
                disabled={!admin}
              >
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
            {cancelErrors.reason ? (
              <p className="field-error">{cancelErrors.reason}</p>
            ) : null}
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={handoffConfirmed}
              onChange={(event) => setHandoffConfirmed(event.target.checked)}
            />
            <span>Termination handed off and agreed with the customer</span>
          </label>
          {cancelErrors.handoff ? (
            <p className="field-error">{cancelErrors.handoff}</p>
          ) : null}
        </Modal>
      ) : null}
    </div>
  );
}
