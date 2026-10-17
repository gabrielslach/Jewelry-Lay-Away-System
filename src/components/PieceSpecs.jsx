export default function PieceSpecs({ piece }) {
  const specs = [
    ['Material', piece.material],
    ['Stone', piece.stone],
    ['Weight', piece.weight],
    ['Type', piece.type],
  ].filter(([, value]) => value);
  if (specs.length === 0) return null;
  return (
    <div className="spec-grid">
      {specs.map(([label, value]) => (
        <div className="spec-item" key={label}>
          <span>{label}</span>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}
