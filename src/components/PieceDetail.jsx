import { formatPeso } from '../lib/money.js';
import Button from './Button.jsx';
import Modal from './Modal.jsx';
import PieceSpecs from './PieceSpecs.jsx';
import PieceImage from './PieceImage.jsx';
import { pickImage } from '../lib/pickImage.js';
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
        <PieceImage
          src={pickImage(piece.images?.[0], 'thumb')}
          alt={piece.name}
          title={piece.name}
          size={60}
        />
      </div>
      <div className="piece-cat">{piece.category}</div>
      <div className="piece-detail-price">{formatPeso(piece.price)}</div>
      <PieceSpecs piece={piece} />
      <div className="plan-box">
        <h4>Lay-Away Available</h4>
        <p>
          Reserve this piece and pay over up to 3 months with fixed 15-day installments. Bank
          transfer is the payment method at checkout.
        </p>
      </div>
    </Modal>
  );
}
