import DataTable from './DataTable.jsx';
import ReportBody from './ReportBody.jsx';
import ReportToolbar from './ReportToolbar.jsx';
import StatTiles, { StatTile } from './StatTiles.jsx';
import { useReport } from './useReport.js';
import { definedColumns } from '../lib/reportColumns.jsx';
import { formatPesoDecimals } from '../lib/money.js';
import { agingLabel, amountOf } from '../lib/reportLabels.js';

const ITEM_COLUMNS = [
  { id: 'plan', header: 'Plan/Order', keys: ['plan_id', 'order_id', 'plan'] },
  { id: 'customer', header: 'Customer', keys: ['customer_name'] },
  { id: 'piece', header: 'Piece', keys: ['item_name', 'piece_name'] },
  { id: 'due', header: 'Due date', keys: ['due_date'], kind: 'date' },
  {
    id: 'amount',
    header: 'Amount due',
    keys: ['amount', 'amount_due'],
    kind: 'money',
  },
  { id: 'days', header: 'Days overdue', keys: ['days_overdue'] },
  { id: 'status', header: 'Status', keys: ['status'], kind: 'label' },
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
          {Object.entries(data?.aging ?? {}).map(([key, bucket]) => (
            <MoneyTile key={key} label={agingLabel(key)} value={bucket} />
          ))}
        </StatTiles>
        <div className="table-wrap">
          <DataTable
            columns={definedColumns(ITEM_COLUMNS, items)}
            data={items}
            getRowId={(_, index) => String(index)}
            emptyMessage="Nothing overdue."
          />
        </div>
      </ReportBody>
    </>
  );
}
