export default function ProgressBar({ value, max, tone = 'ok', label }) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuenow={value}
      aria-valuemax={max}
    >
      <div className={`progress-fill progress-${tone}`} style={{ width: `${percent}%` }} />
    </div>
  );
}
