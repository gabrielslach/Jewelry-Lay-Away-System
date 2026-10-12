import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button.jsx';
import DataTable from '../../components/DataTable.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import PaymentReviewModal from '../../components/PaymentReviewModal.jsx';
import { formatDisplayDate } from '../../lib/dates.js';
import { formatPesoDecimals } from '../../lib/money.js';
import {
  paymentKindLabel,
  paymentDueDateLabel,
} from '../../lib/paymentLabels.js';
import { idNumber, sortByValue } from '../../lib/tableSort.js';
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

  const columns = useMemo(
    () => [
      {
        id: 'order',
        header: 'Order',
        accessorFn: (payment) => `#${payment.plan_id}`,
        sortingFn: sortByValue((payment) => idNumber(payment.plan_id)),
        cell: ({ row }) => `#${row.original.plan_id}`,
      },
      {
        id: 'customer',
        header: 'Customer',
        accessorFn: (payment) => payment.customer_name,
        cell: ({ row }) => row.original.customer_name,
      },
      {
        id: 'kind',
        header: 'Kind',
        accessorFn: paymentKindLabel,
        cell: ({ row }) => paymentKindLabel(row.original),
      },
      {
        id: 'due_date',
        header: 'Due date',
        accessorFn: paymentDueDateLabel,
        sortingFn: sortByValue((payment) => payment.due_date),
        cell: ({ row }) => paymentDueDateLabel(row.original),
      },
      {
        id: 'paid_on',
        header: 'Paid on',
        accessorFn: (payment) => formatDisplayDate(payment.paid_on),
        sortingFn: sortByValue((payment) => payment.paid_on),
        cell: ({ row }) => formatDisplayDate(row.original.paid_on),
      },
      {
        id: 'amount',
        header: 'Amount Expected / Amount Paid',
        accessorFn: (payment) =>
          `${formatPesoDecimals(payment.amount)} / ${formatPesoDecimals(payment.amount_submitted)}`,
        sortingFn: sortByValue((payment) => Number(payment.amount)),
        cell: ({ row }) => (
          <>
            {formatPesoDecimals(row.original.amount)} /{' '}
            {formatPesoDecimals(row.original.amount_submitted)}
            {row.original.amount_mismatch ? (
              <span className="badge badge-warn">Amounts differ</span>
            ) : null}
          </>
        ),
      },
      {
        id: 'reference',
        header: 'Reference',
        accessorFn: (payment) => payment.reference_number,
        cell: ({ row }) => row.original.reference_number,
      },
      {
        id: 'actions',
        header: ' ',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => setSelected(row.original)}>
            View
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="panel">
      <ErrorMessage>{error}</ErrorMessage>
      {!reviewer ? (
        <p className="page-lead">
          Only receivables and admins can confirm or reject.
        </p>
      ) : null}
      <div className="table-wrap">
        <DataTable columns={columns} data={rows} getRowId={(row) => String(row.id)} />
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
