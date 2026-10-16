import { useState } from 'react';
import Button from '../components/Button.jsx';
import Checkout from '../components/Checkout.jsx';
import Gallery from '../components/Gallery.jsx';
import Hero from '../components/Hero.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import PieceDetail from '../components/PieceDetail.jsx';
import Reviews from '../components/Reviews.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import Modal from '../components/Modal.jsx';
import Skeleton, { PieceDetailModalSkeleton } from '../components/Skeleton.jsx';
import { ServiceError } from '../services/http.js';
import { getGalleryPiece } from '../services/getGalleryPiece.js';

export default function Home() {
  const [detail, setDetail] = useState(null);
  const [checkoutPiece, setCheckoutPiece] = useState(null);
  const [error, setError] = useState(null);

  function handleViewDetails(selected) {
    setError(null);
    setDetail({ name: selected.name, piece: null, loading: true });
    getGalleryPiece(selected.id)
      .then((data) => {
        setDetail({ name: data.name, piece: data, loading: false });
      })
      .catch((err) => {
        setDetail(null);
        setError(err instanceof ServiceError ? err.message : 'Unable to load this piece.');
      });
  }

  function handleReserve(selected) {
    setDetail(null);
    setCheckoutPiece(selected);
  }

  function closeDetail() {
    setDetail(null);
  }

  return (
    <>
      <Hero />
      {error ? (
        <div className="container">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      ) : null}
      <Gallery onViewDetails={handleViewDetails} />
      <HowItWorks />
      <Reviews />
      {detail?.piece && !detail.loading ? (
        <PieceDetail
          piece={detail.piece}
          onClose={closeDetail}
          onReserve={handleReserve}
        />
      ) : null}
      {detail?.loading ? (
        <Modal
          title={detail.name}
          onClose={closeDetail}
          footer={
            <>
              <Button variant="outline" onClick={closeDetail}>
                Close
              </Button>
              <Button variant="primary" disabled>
                Reserve This Piece
              </Button>
            </>
          }
        >
          <Skeleton>
            <PieceDetailModalSkeleton />
          </Skeleton>
        </Modal>
      ) : null}
      {checkoutPiece ? (
        <Checkout piece={checkoutPiece} onClose={() => setCheckoutPiece(null)} />
      ) : null}
    </>
  );
}
