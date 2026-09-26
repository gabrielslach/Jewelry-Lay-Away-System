import { useState } from 'react';
import Checkout from '../components/Checkout.jsx';
import Gallery from '../components/Gallery.jsx';
import Hero from '../components/Hero.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import PieceDetail from '../components/PieceDetail.jsx';
import Reviews from '../components/Reviews.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { ServiceError } from '../services/http.js';
import { getGalleryPiece } from '../services/getGalleryPiece.js';

export default function Home() {
  const [piece, setPiece] = useState(null);
  const [checkoutPiece, setCheckoutPiece] = useState(null);
  const [error, setError] = useState(null);

  function handleViewDetails(selected) {
    setError(null);
    getGalleryPiece(selected.id)
      .then(setPiece)
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load this piece.');
      });
  }

  function handleReserve(selected) {
    setPiece(null);
    setCheckoutPiece(selected);
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
      {piece ? (
        <PieceDetail
          piece={piece}
          onClose={() => setPiece(null)}
          onReserve={handleReserve}
        />
      ) : null}
      {checkoutPiece ? (
        <Checkout piece={checkoutPiece} onClose={() => setCheckoutPiece(null)} />
      ) : null}
    </>
  );
}
