import Button from './Button.jsx';
import { formatPeso } from '../lib/money.js';
import { GemMark } from '../theme/assets.js';
import './Gallery.css';

export default function PieceCard({ piece, onViewDetails }) {
  const perPayment = Math.round(piece.price / 6);
  return (
    <article className="piece-card">
      <div className="piece-media">
        <GemMark title={piece.name} />
      </div>
      <div className="piece-body">
        <div className="piece-cat">{piece.category}</div>
        <h3>{piece.name}</h3>
        <div className="piece-price">
          {formatPeso(piece.price)}{' '}
          <small>or as low as {formatPeso(perPayment)}/payment</small>
        </div>
        <div className="piece-actions">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onViewDetails?.(piece)}
          >
            View Details
          </Button>
        </div>
      </div>
    </article>
  );
}
