import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PieceCard from '../components/PieceCard.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Skeleton, { PieceCardSkeletonGrid } from '../components/Skeleton.jsx';
import { ServiceError } from '../services/http.js';
import { getGallery } from '../services/getGallery.js';
import '../components/Gallery.css';
import '../components/SectionHead.css';
import './AuthPage.css';

export default function Collections() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ results: [], next: null, previous: null, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getGallery({ page, pageSize: 12 })
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setData((current) => ({ ...current, results: [] }));
          setError(err instanceof ServiceError ? err.message : 'Unable to load collections.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <section className="section" id="collections">
      <div className="container">
        <SectionHead eyebrow="Shop" title="Collections">
          Browse every piece available for lay-away. Choose a card to see photos and
          details.
        </SectionHead>
        <ErrorMessage>{error}</ErrorMessage>
        <div className="gallery-grid">
          {loading ? (
            <Skeleton>
              <PieceCardSkeletonGrid count={12} />
            </Skeleton>
          ) : (
            data.results.map((piece) => (
              <PieceCard
                key={piece.id}
                piece={piece}
                to={`/collections/${piece.id}`}
              />
            ))
          )}
        </div>
        <nav className="pager" aria-label="Pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || !data.previous}
            onClick={() => {
              setLoading(true);
              setPage((current) => Math.max(1, current - 1));
            }}
          >
            Previous
          </Button>
          <span>Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || !data.next}
            onClick={() => {
              setLoading(true);
              setPage((current) => current + 1);
            }}
          >
            Next
          </Button>
        </nav>
      </div>
    </section>
  );
}
