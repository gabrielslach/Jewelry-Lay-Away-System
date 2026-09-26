import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ServiceError } from '../services/http.js';
import { getGallery } from '../services/getGallery.js';
import ErrorMessage from './ErrorMessage.jsx';
import PieceCard from './PieceCard.jsx';
import SectionHead from './SectionHead.jsx';
import './Gallery.css';
import './SectionHead.css';

export default function Gallery({ onViewDetails }) {
  const [pieces, setPieces] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getGallery({ page: 1, pageSize: 6 })
      .then((page) => {
        if (!cancelled) {
          setPieces(page.results);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ServiceError ? err.message : 'Unable to load collections.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="section" id="collections">
      <div className="container">
        <SectionHead eyebrow="Collections" title="Handpicked Pieces">
          A sample of what&apos;s available in-store — every piece can be reserved
          with a lay-away plan.
        </SectionHead>
        <ErrorMessage>{error}</ErrorMessage>
        <div className="gallery-grid">
          {pieces.map((piece) => (
            <PieceCard
              key={piece.id}
              piece={piece}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
        <p className="gallery-more">
          <Link to="/collections">View all collections</Link>
        </p>
      </div>
    </section>
  );
}
