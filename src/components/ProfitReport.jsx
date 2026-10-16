import { useState } from 'react';
import DataTable from './DataTable.jsx';
import ReportBody from './ReportBody.jsx';
import ReportFilters from './ReportFilters.jsx';
import ReportToolbar from './ReportToolbar.jsx';
import StatTiles, { StatTile } from './StatTiles.jsx';
import { useReport } from './useReport.js';
import { formatMonth } from '../lib/dates.js';
import { formatPesoDecimals } from '../lib/money.js';
import { rightColumn, textColumn } from '../lib/reportColumns.jsx';
import { humanizeKey } from '../lib/reportLabels.js';

const EMPTY_FILTERS = { from: '', to: '' };

const MONTH_COLUMNS = [
  textColumn('month', 'Month', (row) => formatMonth(row.month)),
  rightColumn('interest_profit', 'Interest profit', (row) =>
    formatPesoDecimals(row.interest_profit),
  ),
  rightColumn('markup_profit', 'Markup profit', (row) =>
    formatPesoDecimals(row.markup_profit),
  ),
  rightColumn('total', 'Total', (row) =>
    formatPesoDecimals(row.interest_profit + row.markup_profit),
  ),
];

const COUNT_KEYS = ['installments_paid', 'plans_counted'];

function SourceTile({ label, source }) {
  if (source !== null && typeof source === 'object') {
    return (
      <StatTile
        label={label}
        lines={Object.entries(source).map(([key, value]) => ({
          label: humanizeKey(key),
          value: COUNT_KEYS.includes(key)
            ? String(value)
            : formatPesoDecimals(value),
        }))}
      />
    );
  }
  return <StatTile label={label} value={formatPesoDecimals(source ?? 0)} />;
}

export default function ProfitReport() {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const { data, loading, error, retry } = useReport('profit', applied);
  const months = data?.by_month ?? [];

  function clear() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  }

  return (
    <>
      <ReportToolbar report="profit" exportFilters={applied}>
        <ReportFilters
          values={draft}
          onChange={setDraft}
          onApply={() => setApplied(draft)}
          onClear={clear}
        />
      </ReportToolbar>
      <ReportBody
        loading={loading}
        error={error}
        onRetry={retry}
        empty={!data}
        emptyMessage="No profit recorded for this period."
      >
        <StatTiles>
          <SourceTile label="Interest profit" source={data?.interest_profit} />
          <SourceTile label="Markup profit" source={data?.markup_profit} />
          <StatTile
            label="Total realized"
            value={formatPesoDecimals(data?.total_realized ?? 0)}
            emphasis
          />
        </StatTiles>
        <StatTiles secondary>
          <StatTile
            small
            label="Principal collected"
            value={formatPesoDecimals(data?.principal_collected ?? 0)}
          />
          <StatTile
            small
            label="Down payments collected"
            value={formatPesoDecimals(data?.down_payments_collected ?? 0)}
          />
        </StatTiles>
        <div className="table-wrap">
          <DataTable
            columns={MONTH_COLUMNS}
            data={months}
            getRowId={(row) => row.month}
            emptyMessage="No profit recorded for this period."
          />
        </div>
      </ReportBody>
    </>
  );
}
