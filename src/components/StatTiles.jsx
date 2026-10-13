import './StatTiles.css';

export function StatTile({ label, value, lines, emphasis = false }) {
  return (
    <div className={emphasis ? 'stat-tile stat-tile-emphasis' : 'stat-tile'}>
      <span className="stat-label">{label}</span>
      {value !== undefined ? <b className="stat-value">{value}</b> : null}
      {lines?.map((line) => (
        <span className="stat-line" key={line.label}>
          {line.label}: <b>{line.value}</b>
        </span>
      ))}
    </div>
  );
}

export default function StatTiles({ children }) {
  return <div className="stat-tiles">{children}</div>;
}
