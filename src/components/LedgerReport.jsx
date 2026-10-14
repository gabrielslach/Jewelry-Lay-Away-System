import { useMemo, useState } from 'react';
import Button from './Button.jsx';
import DataTable from './DataTable.jsx';
import ReportBody from './ReportBody.jsx';
import ReportFilters from './ReportFilters.jsx';
import ReportToolbar from './ReportToolbar.jsx';
import StatTiles, { StatTile } from './StatTiles.jsx';
import { useReport } from './useReport.js';
import { formatManilaDateTime } from '../lib/dates.js';
import { formatPesoDecimals } from '../lib/money.js';
import { rightColumn, textColumn } from '../lib/reportColumns.jsx';
import { humanizeKey } from '../lib/reportLabels.js';

const PAGE_SIZE = 25;
const EMPTY_FILTERS = { from: '', to: '', entry_type: '', plan_id: '' };
const ENTRY_TYPES = ['payment', 'penalty', 'receivable'];

const idOrDash = (prefix, id) => (id == null ? '-' : `${prefix}${id}`);

const LEDGER_COLUMNS = [
  textColumn('date', 'Date', (row) => formatManilaDateTime(row.created_at)),
  textColumn('type', 'Type', (row) => humanizeKey(row.entry_type)),
  textColumn('customer', 'Customer', (row) => row.customer_name || '-'),
  textColumn('plan', 'Plan', (row) => idOrDash('#', row.plan_id)),
  textColumn('installment', 'Installment', (row) =>
    idOrDash('#', row.installment_id),
  ),
  rightColumn('amount', 'Amount', (row) => formatPesoDecimals(row.amount)),
];

export default function LedgerReport() {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [offset, setOffset] = useState(0);
  const query = useMemo(
    () => ({ ...applied, limit: PAGE_SIZE + 1, offset }),
    [applied, offset],
  );
  const { data, loading, error, retry } = useReport('ledger', query);
  const fetched = data ?? [];
  const rows = fetched.slice(0, PAGE_SIZE);
  const pageTotal = rows.reduce((sum, row) => sum + Number(row.amount), 0);

  function apply(filters) {
    setApplied(filters);
    setOffset(0);
  }

  function clear() {
    setDraft(EMPTY_FILTERS);
    apply(EMPTY_FILTERS);
  }

  const hasNext = fetched.length > PAGE_SIZE;

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
          <StatTile label="Page total" value={formatPesoDecimals(pageTotal)} />
        </StatTiles>
        <div className="table-wrap">
          <DataTable
            columns={LEDGER_COLUMNS}
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
