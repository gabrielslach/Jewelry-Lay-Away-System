import { formatPeso } from '../lib/money.js';
import { GemMark } from '../theme/assets.js';
import Button from './Button.jsx';
import Modal from './Modal.jsx';
import './Gallery.css';
import './PieceDetail.css';

export default function PieceDetail({ piece, onClose, onReserve }) {
  return (
    <Modal
      title={piece.name}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={() => onReserve?.(piece)}>
            Reserve This Piece
          </Button>
        </>
      }
    >
      <div className="modal-media">
        <GemMark size={60} title={piece.name} />
      </div>
      <div className="piece-cat">{piece.category}</div>
      <div className="piece-detail-price">{formatPeso(piece.price)}</div>
      <div className="spec-grid">
        <div className="spec-item">
          <span>Material</span>
          <b>{piece.material}</b>
        </div>
        <div className="spec-item">
          <span>Stone</span>
          <b>{piece.stone}</b>
        </div>
        <div className="spec-item">
          <span>Size</span>
          <b>{piece.size}</b>
        </div>
        <div className="spec-item">
          <span>Certification</span>
          <b>{piece.cert}</b>
        </div>
      </div>
      <div className="plan-box">
        <h4>Lay-Away Available</h4>
        <p>
          Reserve this piece and pay over up to 3 months — you&apos;ll choose your
          exact payment dates and payment method in the next step.
        </p>
      </div>
    </Modal>
  );
}
