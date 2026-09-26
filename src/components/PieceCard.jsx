import { useNavigate } from 'react-router-dom';
import Button from './Button.jsx';
import PieceImage from './PieceImage.jsx';
import { formatPeso } from '../lib/money.js';
import './Gallery.css';

export default function PieceCard({ piece, onViewDetails, to }) {
  const navigate = useNavigate();
  const perPayment = Math.round(piece.price / 6);

  function openDetails() {
    if (to) {
      navigate(to);
      return;
    }
    onViewDetails?.(piece);
  }

  return (
    <article className="piece-card">
      <div className="piece-media" onClick={openDetails}>
        <PieceImage src={piece.images?.[0]?.url} title={piece.name} />
      </div>
      <div className="piece-body">
        <div className="piece-cat">{piece.category}</div>
        <h3 onClick={openDetails}>{piece.name}</h3>
        <div className="piece-price">
          {formatPeso(piece.price)}{' '}
          <small>or as low as {formatPeso(perPayment)}/payment</small>
        </div>
        <div className="piece-actions">
          {to ? (
            <Button
              variant="primary"
              size="sm"
              to={to}
              onClick={(event) => event.stopPropagation()}
            >
              View Details
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onViewDetails?.(piece);
              }}
            >
              View Details
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
