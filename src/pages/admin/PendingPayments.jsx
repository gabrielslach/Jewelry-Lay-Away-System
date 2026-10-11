import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import PaymentReviewModal from '../../components/PaymentReviewModal.jsx';
import { formatDisplayDate } from '../../lib/dates.js';
import { formatPesoDecimals } from '../../lib/money.js';
import { paymentKindLabel, paymentTermLabel } from '../../lib/paymentLabels.js';
import { getAdminPendingPayments } from '../../services/adminPayments.js';
import { ServiceError } from '../../services/http.js';
import { getAdminSession } from '../../services/session.js';
import '../../components/Checkout.css';

function canReview() {
  const role = getAdminSession()?.admin?.role ?? 'admin';
  return role === 'admin' || role === 'receivables';
}

export default function PendingPayments() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const reviewer = canReview();

  function refresh() {
    getAdminPendingPayments()
      .then(setRows)
      .catch((err) => {
        setError(
          err instanceof ServiceError
            ? err.message
            : 'Unable to load pending payments.',
        );
      });
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleDone() {
    setSelected(null);
    refresh();
  }

  return (
    <div className="panel">
      <ErrorMessage>{error}</ErrorMessage>
      {!reviewer ? (
        <p className="page-lead">
          Only receivables and admins can confirm or reject.
        </p>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Kind</th>
              <th>Due date</th>
              <th>Paid on</th>
              <th>Amount Expected / Amount Paid</th>
              <th>Reference</th>
              <th> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>#{row.plan_id}</td>
                <td>{paymentKindLabel(row)}</td>
                <td>{row.customer_name}</td>
                <td>{paymentTermLabel(row)}</td>
                <td>{formatDisplayDate(row.paid_on)}</td>
                <td>
                  {formatPesoDecimals(row.amount)} /{' '}
                  {formatPesoDecimals(row.amount_submitted)}
                  {row.amount_mismatch ? (
                    <span className="badge badge-warn">Amounts differ</span>
                  ) : null}
                </td>
                <td>{row.reference_number}</td>
                <td>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(row)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? (
        <p className="empty-copy">No payments waiting for confirmation.</p>
      ) : null}
      {selected ? (
        <PaymentReviewModal
          payment={selected}
          reviewer={reviewer}
          onClose={() => setSelected(null)}
          onDone={handleDone}
        />
      ) : null}
    </div>
  );
}
