import { useState } from 'react';
import Checkout from '../components/Checkout.jsx';
import Gallery from '../components/Gallery.jsx';
import Hero from '../components/Hero.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import PieceDetail from '../components/PieceDetail.jsx';
import Reviews from '../components/Reviews.jsx';
import { getGalleryPiece } from '../data/gallery.js';

export default function Home() {
  const [piece, setPiece] = useState(null);
  const [checkoutPiece, setCheckoutPiece] = useState(null);

  function handleViewDetails(selected) {
    getGalleryPiece(selected.id).then(setPiece);
  }

  function handleReserve(selected) {
    setPiece(null);
    setCheckoutPiece(selected);
  }

  return (
    <>
      <Hero />
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
