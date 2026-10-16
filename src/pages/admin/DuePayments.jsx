import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button.jsx';
import DataTable from '../../components/DataTable.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Modal from '../../components/Modal.jsx';
import { addDaysIso, formatDisplayDate, todayIsoLocal } from '../../lib/dates.js';
import { formatPesoDecimals } from '../../lib/money.js';
import { idNumber, sortByValue } from '../../lib/tableSort.js';
import { getAdminDuePayments } from '../../services/adminPayments.js';
import { ServiceError } from '../../services/http.js';
import '../../components/PieceDetail.css';
import '../Account.css';

function graceNotice(row) {
  const graceDays = row.grace_period_days;
  const graceEnd = row.grace_ends_on ?? (graceDays != null && row.due_date
    ? addDaysIso(row.due_date, Number(graceDays))
    : null);
  if (!graceEnd || !(row.days_overdue > 0)) {
    return null;
  }
  const today = todayIsoLocal();
  if (graceEnd < today) {
    return `Grace period expired ${formatDisplayDate(graceEnd)} — reconstructs on next daily run.`;
  }
  return `Grace period ends ${formatDisplayDate(graceEnd)}.`;
}

function statusCell(row) {
  const grace = graceNotice(row);
  return (
    <>
      {row.due_today ? (
        <span className="badge badge-amber">Due today</span>
      ) : row.days_overdue > 0 ? (
        <span className="badge badge-warn">{row.days_overdue} days overdue</span>
      ) : null}
      {row.awaiting_confirmation ? (
        <div className="table-sub">
          <span className="badge badge-info">Payment awaiting confirmation</span>
        </div>
      ) : null}
      {grace ? <div className="table-sub">{grace}</div> : null}
    </>
  );
}

export default function DuePayments() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [viewRow, setViewRow] = useState(null);

  useEffect(() => {
    getAdminDuePayments()
      .then(setData)
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load due list.');
      });
  }, []);

  const items = useMemo(() => data?.items ?? [], [data]);
  const filtered = useMemo(
    () =>
      filter === 'due_today'
        ? items.filter((row) => row.due_today)
        : filter === 'overdue'
          ? items.filter((row) => row.days_overdue > 0)
          : items,
    [items, filter],
  );

  const columns = useMemo(
    () => [
      {
        id: 'order',
        header: 'Order',
        accessorFn: (row) => `#${row.plan_id}`,
        sortingFn: sortByValue((row) => idNumber(row.plan_id)),
        cell: ({ row }) => `#${row.original.plan_id}`,
      },
      {
        id: 'customer',
        header: 'Customer',
        accessorFn: (row) =>
          [row.customer_name, row.customer_email, row.customer_phone].join(' '),
        cell: ({ row }) => (
          <>
            <div>{row.original.customer_name}</div>
            <div className="table-sub">{row.original.customer_email}</div>
            <div className="table-sub">{row.original.customer_phone}</div>
          </>
        ),
      },
      {
        id: 'term',
        header: 'Term',
        accessorFn: (row) => `Payment ${row.term_number}`,
        sortingFn: sortByValue((row) => Number(row.term_number)),
        cell: ({ row }) => `Payment ${row.original.term_number}`,
      },
      {
        id: 'amount',
        header: 'Amount',
        accessorFn: (row) => formatPesoDecimals(row.amount),
        sortingFn: sortByValue((row) => Number(row.amount)),
        cell: ({ row }) => formatPesoDecimals(row.original.amount),
      },
      {
        id: 'due_date',
        header: 'Due date',
        accessorFn: (row) => formatDisplayDate(row.due_date),
        sortingFn: sortByValue((row) => row.due_date),
        cell: ({ row }) => formatDisplayDate(row.original.due_date),
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (row) =>
          row.due_today ? 'Due today' : row.days_overdue > 0 ? `${row.days_overdue} days overdue` : '',
        sortingFn: sortByValue((row) => Number(row.days_overdue) || 0),
        cell: ({ row }) => statusCell(row.original),
      },
      {
        id: 'view',
        header: 'View',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => setViewRow(row.original)}>
            View
          </Button>
        ),
      },
    ],
    [],
  );

  const dueCount = items.filter((row) => row.due_today).length;
  const overdueCount = items.filter((row) => row.days_overdue > 0).length;
  const viewGrace = viewRow ? graceNotice(viewRow) : null;

  return (
    <div className="panel">
      <p className="page-lead">
        A daily list of terms due today plus overdue ones. The grace period is 7 days; after it the
        plan is reconstructed on the next daily run. A term with a payment already submitted is
        flagged so nobody chases a customer who has paid.
      </p>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="filter-row">
        {[
          { id: 'all', label: `All (${items.length})` },
          { id: 'due_today', label: `Due today (${dueCount})` },
          { id: 'overdue', label: `Overdue (${overdueCount})` },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            className={filter === option.id ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="table-wrap">
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(row) => `${row.plan_id}-${row.installment_id}`}
        />
      </div>
      {!filtered.length ? <p className="empty-copy">Nothing due or overdue.</p> : null}

      {viewRow ? (
        <Modal
          title={`Order #${viewRow.plan_id}`}
          onClose={() => setViewRow(null)}
          footer={
            <Button variant="outline" onClick={() => setViewRow(null)}>
              Close
            </Button>
          }
        >
          <div className="spec-grid">
            <div className="spec-item">
              <span>Customer</span>
              <b>{viewRow.customer_name}</b>
            </div>
            <div className="spec-item">
              <span>Piece</span>
              <b>{viewRow.item_name ?? viewRow.piece_id ?? '—'}</b>
            </div>
            <div className="spec-item">
              <span>Term</span>
              <b>
                Payment {viewRow.term_number} - {formatPesoDecimals(viewRow.amount)}
              </b>
            </div>
            <div className="spec-item">
              <span>Due date</span>
              <b>{formatDisplayDate(viewRow.due_date)}</b>
            </div>
          </div>
          {viewRow.awaiting_confirmation ? (
            <div className="plan-notice">
              <b>Payment awaiting confirmation</b>
              <p>
                A payment for this term is awaiting confirmation. Open Pending payments to confirm
                or reject it.
              </p>
            </div>
          ) : null}
          {viewGrace ? (
            <div className="plan-notice">
              <b>Grace period</b>
              <p>{viewGrace}</p>
            </div>
          ) : null}
        </Modal>
      ) : null}
    </div>
  );
}
