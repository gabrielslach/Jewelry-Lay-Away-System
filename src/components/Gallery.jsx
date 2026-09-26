import { useEffect, useState } from 'react';
import { getGallery } from '../data/gallery.js';
import PieceCard from './PieceCard.jsx';
import SectionHead from './SectionHead.jsx';
import './Gallery.css';
import './SectionHead.css';

export default function Gallery({ onViewDetails }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getGallery().then((page) => {
      if (!cancelled) {
        setPieces(page.results);
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
        <div className="gallery-grid">
          {pieces.map((piece) => (
            <PieceCard
              key={piece.id}
              piece={piece}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
