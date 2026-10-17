import { useEffect, useState } from 'react';
import { formatManilaDate } from '../lib/dates.js';
import { formatPesoDecimals } from '../lib/money.js';
import { paymentKindLabel } from '../lib/paymentLabels.js';
import { getPaymentHistory } from '../services/adminPayments.js';
import Button from './Button.jsx';
import DataTable from './DataTable.jsx';
import Modal from './Modal.jsx';
import Tabs from './Tabs.jsx';
import './PaymentHistoryModal.css';

const FILTERS = [
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'rejected', label: 'Rejected' },
];
const BADGES = { confirmed: 'badge-ok', rejected: 'badge-warn' };
const PLAIN = { enableSorting: false, enableColumnFilter: false };

const columns = [
  {
    ...PLAIN,
    id: 'date',
    header: 'Date',
    cell: ({ row }) => formatManilaDate(row.original.reviewed_at),
  },
  { ...PLAIN, id: 'customer', header: 'Customer', accessorKey: 'customer_name' },
  {
    ...PLAIN,
    id: 'order',
    header: 'Plan/Order',
    cell: ({ row }) => `#${row.original.plan_id} · ${paymentKindLabel(row.original)}`,
  },
  { ...PLAIN, id: 'method', header: 'Method', cell: () => 'Bank transfer' },
  {
    ...PLAIN,
    id: 'amount',
    header: 'Amount',
    cell: ({ row }) => formatPesoDecimals(row.original.amount),
  },
  {
    ...PLAIN,
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span className={`badge ${BADGES[row.original.outcome]}`}>
        {row.original.outcome === 'confirmed' ? 'Confirmed' : 'Rejected'}
      </span>
    ),
  },
];

export default function PaymentHistoryModal({ onClose }) {
  const [status, setStatus] = useState('confirmed');
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getPaymentHistory({ status, limit: 50 })
      .then((data) => !cancelled && setRows(data))
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [status, attempt]);

  function reload(nextStatus = status) {
    setLoading(true);
    setFailed(false);
    setStatus(nextStatus);
    setAttempt((count) => count + 1);
  }

  const emptyMessage = `No ${status} payments.`;

  return (
    <Modal title="Payment history" onClose={onClose}>
      <Tabs label="Payment outcome" tabs={FILTERS} active={status} onChange={reload} />
      <div id={`panel-${status}`} role="tabpanel" aria-labelledby={`tab-${status}`}>
        {loading ? <p className="field-hint">Loading history…</p> : null}
        {failed ? (
          <div role="alert">
            <p>Couldn&apos;t load history.</p>
            <Button variant="outline" size="sm" onClick={() => reload()}>
              Retry
            </Button>
          </div>
        ) : null}
        {!loading && !failed ? (
          <div className="table-wrap history-table">
            <DataTable
              columns={columns}
              data={rows}
              getRowId={(row) => String(row.id)}
              emptyMessage={emptyMessage}
            />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
