import { useState } from 'react';
import DataTable from './DataTable.jsx';
import ReportBody from './ReportBody.jsx';
import ReportFilters from './ReportFilters.jsx';
import ReportToolbar from './ReportToolbar.jsx';
import StatTiles, { StatTile } from './StatTiles.jsx';
import { useReport } from './useReport.js';
import { formatMonth } from '../lib/dates.js';
import { formatPesoDecimals } from '../lib/money.js';
import { humanizeKey } from '../lib/reportLabels.js';

const EMPTY_FILTERS = { from: '', to: '' };

function money(value) {
  return (
    <span className="cell-right num-cell">{formatPesoDecimals(value)}</span>
  );
}

function moneyColumn(id, header) {
  return {
    id,
    header: () => <span className="cell-right">{header}</span>,
    enableSorting: false,
    accessorFn: (row) => row[id],
    cell: ({ row }) => money(row.original[id]),
  };
}

const MONTH_COLUMNS = [
  {
    id: 'month',
    header: 'Month',
    enableSorting: false,
    accessorFn: (row) => formatMonth(row.month),
  },
  moneyColumn('interest_profit', 'Interest profit'),
  moneyColumn('markup_profit', 'Markup profit'),
  moneyColumn('total', 'Total'),
];

function SourceTile({ label, source }) {
  if (source !== null && typeof source === 'object') {
    return (
      <StatTile
        label={label}
        lines={Object.entries(source).map(([key, value]) => ({
          label: humanizeKey(key),
          value: formatPesoDecimals(value),
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
