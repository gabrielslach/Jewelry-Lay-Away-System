import { useMemo, useState } from 'react';
import Button from './Button.jsx';
import DataTable from './DataTable.jsx';
import ReportBody from './ReportBody.jsx';
import ReportFilters from './ReportFilters.jsx';
import ReportToolbar from './ReportToolbar.jsx';
import StatTiles, { StatTile } from './StatTiles.jsx';
import { useReport } from './useReport.js';
import { formatPesoDecimals } from '../lib/money.js';
import { definedColumns } from '../lib/reportColumns.jsx';

const PAGE_SIZE = 25;
const EMPTY_FILTERS = { from: '', to: '', entry_type: '', plan_id: '' };
const ENTRY_TYPES = ['payment', 'penalty', 'receivable'];

const LEDGER_COLUMNS = [
  {
    id: 'date',
    header: 'Date',
    keys: ['date', 'entry_date', 'created_at'],
    kind: 'date',
  },
  {
    id: 'type',
    header: 'Entry type',
    keys: ['entry_type', 'type'],
    kind: 'label',
  },
  { id: 'plan', header: 'Plan', keys: ['plan_id', 'plan'] },
  { id: 'customer', header: 'Customer', keys: ['customer_name'] },
  {
    id: 'description',
    header: 'Description',
    keys: ['description', 'reference', 'note'],
  },
  { id: 'amount', header: 'Amount', keys: ['amount'], kind: 'money' },
  { id: 'balance', header: 'Balance', keys: ['balance'], kind: 'money' },
];

function splitResponse(data) {
  if (Array.isArray(data)) {
    return { rows: data, total: null, sum: null };
  }
  return {
    rows: data?.results ?? data?.entries ?? [],
    total: data?.count ?? data?.total_count ?? null,
    sum: data?.total_amount ?? null,
  };
}

export default function LedgerReport() {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [offset, setOffset] = useState(0);
  const query = useMemo(
    () => ({ ...applied, limit: PAGE_SIZE, offset }),
    [applied, offset],
  );
  const { data, loading, error, retry } = useReport('ledger', query);
  const { rows, total, sum } = splitResponse(data);

  function apply(filters) {
    setApplied(filters);
    setOffset(0);
  }

  function clear() {
    setDraft(EMPTY_FILTERS);
    apply(EMPTY_FILTERS);
  }

  const hasNext =
    total != null ? offset + PAGE_SIZE < total : rows.length === PAGE_SIZE;

  return (
    <>
      <ReportToolbar report="ledger" exportFilters={applied}>
        <ReportFilters
          values={draft}
          onChange={setDraft}
          onApply={() => apply(draft)}
          onClear={clear}
        >
          <div className="form-row">
            <label htmlFor="report-entry-type">Entry type</label>
            <select
              id="report-entry-type"
              value={draft.entry_type}
              onChange={(event) =>
                setDraft({ ...draft, entry_type: event.target.value })
              }
            >
              <option value="">All types</option>
              {ENTRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="report-plan-id">Plan ID</label>
            <input
              id="report-plan-id"
              type="number"
              min="1"
              placeholder="Plan ID"
              value={draft.plan_id}
              onChange={(event) =>
                setDraft({ ...draft, plan_id: event.target.value })
              }
            />
          </div>
        </ReportFilters>
      </ReportToolbar>
      <ReportBody
        loading={loading}
        error={error}
        onRetry={retry}
        empty={rows.length === 0 && offset === 0}
        emptyMessage="No results for these filters."
      >
        <StatTiles>
          <StatTile label="Entries shown" value={rows.length} />
          {total != null ? (
            <StatTile label="Total entries" value={total} />
          ) : null}
          {sum != null ? (
            <StatTile label="Total amount" value={formatPesoDecimals(sum)} />
          ) : null}
        </StatTiles>
        <div className="table-wrap">
          <DataTable
            columns={definedColumns(LEDGER_COLUMNS, rows)}
            data={rows}
            getRowId={(_, index) => String(index)}
            emptyMessage="No more entries."
          />
        </div>
        <div className="report-pager">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(offset - PAGE_SIZE)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next
          </Button>
          {rows.length > 0 ? (
            <span className="muted">
              Showing {offset + 1}-{offset + rows.length}
            </span>
          ) : null}
        </div>
      </ReportBody>
    </>
  );
}
