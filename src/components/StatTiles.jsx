import './StatTiles.css';

export function StatTile({
  label,
  value,
  note,
  lines,
  emphasis = false,
  small = false,
}) {
  const className = [
    'stat-tile',
    emphasis && 'stat-tile-emphasis',
    small && 'stat-tile-small',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={className}>
      <span className="stat-label">{label}</span>
      {value !== undefined ? <b className="stat-value">{value}</b> : null}
      {note ? <span className="stat-line">{note}</span> : null}
      {lines?.map((line) => (
        <span className="stat-line" key={line.label}>
          {line.label}: <b>{line.value}</b>
        </span>
      ))}
    </div>
  );
}

export default function StatTiles({ children, secondary = false }) {
  return (
    <div
      className={secondary ? 'stat-tiles stat-tiles-secondary' : 'stat-tiles'}
    >
      {children}
    </div>
  );
}
