import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/useToast.js';
import { ServiceError } from '../../services/http.js';
import { getAdminPlans } from '../../services/getAdminPlans.js';
import { markNextPaid } from '../../services/markNextPaid.js';
import '../Account.css';
import '../../components/Checkout.css';

export default function Orders() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null);

  function load() {
    getAdminPlans()
      .then(setPlans)
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load orders.');
      });
  }

  useEffect(() => {
    load();
  }, []);

  const rows = plans.filter((plan) => filter === 'all' || plan.status === filter);

  async function handleMarkPaid() {
    try {
      await markNextPaid(active.id);
      showToast(`Payment marked as received for ${active.id}.`);
      setActive(null);
      load();
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to mark payment.');
    }
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
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Item</th>
              <th>Plan</th>
              <th>Next Due</th>
              <th>Status</th>
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
                <td>
                  <Button variant="outline" size="sm" onClick={() => setActive(plan)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <Button variant="primary" onClick={handleMarkPaid}>
                Mark Next Payment Received
              </Button>
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
              <b>{active.status === 'ok' ? 'On Track' : 'Overdue'}</b>
            </div>
          </div>
          <div className="schedule-list">
            {active.installments.map((row, index) => (
              <div className="schedule-row" key={row.id}>
                <b>
                  Payment {index + 1} of {active.installments.length}
                </b>
                <span>₱{Number(row.amount).toLocaleString('en-US')}</span>
                  <span
                    className={
                      row.status === 'paid'
                        ? 'badge badge-ok'
                        : 'badge badge-warn'
                    }
                  >
                    {row.status === 'paid'
                      ? 'Paid'
                      : row.status === 'overdue'
                        ? 'Overdue'
                        : 'Pending'}
                  </span>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
