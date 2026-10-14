import DataTable from './DataTable.jsx';
import ReportBody from './ReportBody.jsx';
import ReportToolbar from './ReportToolbar.jsx';
import StatTiles, { StatTile } from './StatTiles.jsx';
import { useReport } from './useReport.js';
import { rightColumn, textColumn } from '../lib/reportColumns.jsx';
import { formatManilaDate } from '../lib/dates.js';
import { formatPesoDecimals } from '../lib/money.js';
import { amountOf } from '../lib/reportLabels.js';

const ITEM_COLUMNS = [
  {
    ...textColumn('customer', 'Customer', (row) => row.customer_name || '-'),
    cell: ({ row }) => (
      <>
        <div>{row.original.customer_name || '-'}</div>
        {row.original.customer_email ? (
          <small className="muted customer-contact">
            {row.original.customer_email}
          </small>
        ) : null}
        {row.original.customer_phone ? (
          <small className="muted customer-contact">
            {row.original.customer_phone}
          </small>
        ) : null}
      </>
    ),
  },
  textColumn('plan', 'Plan', (row) => `#${row.plan_id}`),
  textColumn('installment', 'Installment', (row) => `#${row.term_number}`),
  textColumn('due', 'Due date', (row) => formatManilaDate(row.due_date)),
  rightColumn('amount', 'Amount due', (row) => formatPesoDecimals(row.amount)),
  rightColumn('days', 'Days overdue', (row) =>
    row.days_overdue > 0 ? row.days_overdue : '-',
  ),
];

const NO_FILTERS = {};

function MoneyTile({ label, value }) {
  const amount = amountOf(value);
  return (
    <StatTile
      label={label}
      value={amount == null ? '-' : formatPesoDecimals(amount)}
    />
  );
}

export default function ReceivablesReport() {
  const { data, loading, error, retry } = useReport('receivables', NO_FILTERS);
  const items = data?.items ?? [];

  return (
    <>
      <ReportToolbar report="receivables" exportFilters={NO_FILTERS}>
        <span className="muted">As of today</span>
      </ReportToolbar>
      <ReportBody
        loading={loading}
        error={error}
        onRetry={retry}
        empty={items.length === 0 && !data?.outstanding_receivable}
        emptyMessage="Nothing outstanding."
      >
        <StatTiles>
          <MoneyTile
            label="Outstanding receivable"
            value={data?.outstanding_receivable}
          />
          <MoneyTile label="Overdue" value={data?.overdue} />
          {(data?.aging ?? []).map(({ label, count, amount }) => (
            <StatTile
              key={label}
              label={label}
              value={formatPesoDecimals(amount)}
              note={`${count} ${count === 1 ? 'installment' : 'installments'}`}
            />
          ))}
        </StatTiles>
        <div className="table-wrap">
          <DataTable
            columns={ITEM_COLUMNS}
            data={items}
            getRowId={(_, index) => String(index)}
            emptyMessage="Nothing overdue."
          />
        </div>
      </ReportBody>
    </>
  );
}
