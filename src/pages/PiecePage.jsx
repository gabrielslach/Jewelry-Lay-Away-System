import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Checkout from '../components/Checkout.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { GemMark } from '../theme/assets.js';
import { ServiceError } from '../services/http.js';
import { getGalleryPiece } from '../services/getGalleryPiece.js';
import '../components/Gallery.css';
import '../components/PieceDetail.css';
import './PiecePage.css';

export default function PiecePage() {
  const { id } = useParams();
  const [piece, setPiece] = useState(null);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [checkout, setCheckout] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getGalleryPiece(id)
      .then((data) => {
        if (!cancelled) {
          setPiece(data);
          setIndex(0);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPiece(null);
          setError(err instanceof ServiceError ? err.message : 'Unable to load this piece.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const images = piece?.images?.length ? piece.images : [];

  return (
    <section className="piece-page">
      <Link to="/collections" className="back-link">
        Back to collections
      </Link>
      <ErrorMessage>{error}</ErrorMessage>
      {piece ? (
        <div className="piece-layout">
          <div className="carousel">
            <div className="carousel-main">
              {images[index]?.url ? (
                <img src={images[index].url} alt={`${piece.name} photo ${index + 1}`} />
              ) : (
                <GemMark size={80} title={piece.name} />
              )}
            </div>
            {images.length > 1 ? (
              <div className="carousel-thumbs">
                {images.map((image, thumbIndex) => (
                  <button
                    key={image.url + thumbIndex}
                    type="button"
                    className={thumbIndex === index ? 'thumb active' : 'thumb'}
                    onClick={() => setIndex(thumbIndex)}
                    aria-label={`Show photo ${thumbIndex + 1}`}
                  >
                    <img src={image.url} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <div className="piece-cat">{piece.category}</div>
            <h1>{piece.name}</h1>
            <p className="piece-sku">{piece.title}</p>
            <div className="piece-detail-price">{piece.priceLabel}</div>
            <p className="page-lead">as low as {piece.perPaymentLabel}/payment</p>
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
            <Button variant="primary" onClick={() => setCheckout(true)}>
              Reserve This Piece
            </Button>
          </div>
        </div>
      ) : null}
      {checkout && piece ? (
        <Checkout piece={piece} onClose={() => setCheckout(false)} />
      ) : null}
    </section>
  );
}
