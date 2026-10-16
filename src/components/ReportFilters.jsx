import Button from './Button.jsx';

export default function ReportFilters({
  values,
  onChange,
  onApply,
  onClear,
  children,
}) {
  return (
    <>
      <div className="form-row">
        <label htmlFor="report-from">From</label>
        <input
          id="report-from"
          type="date"
          value={values.from}
          onChange={(event) =>
            onChange({ ...values, from: event.target.value })
          }
        />
      </div>
      <div className="form-row">
        <label htmlFor="report-to">To</label>
        <input
          id="report-to"
          type="date"
          value={values.to}
          onChange={(event) => onChange({ ...values, to: event.target.value })}
        />
      </div>
      {children}
      <div className="report-filters-actions">
        <Button size="sm" onClick={onApply}>
          Apply
        </Button>
        <button type="button" className="text-link" onClick={onClear}>
          Clear
        </button>
      </div>
    </>
  );
}
