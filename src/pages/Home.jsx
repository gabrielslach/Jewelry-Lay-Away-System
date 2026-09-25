import { useState } from 'react';
import Gallery from '../components/Gallery.jsx';
import Hero from '../components/Hero.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import PieceDetail from '../components/PieceDetail.jsx';
import Reviews from '../components/Reviews.jsx';
import { getGalleryPiece } from '../data/gallery.js';

export default function Home() {
  const [piece, setPiece] = useState(null);

  function handleViewDetails(selected) {
    getGalleryPiece(selected.id).then(setPiece);
  }

  return (
    <>
      <Hero />
      <Gallery onViewDetails={handleViewDetails} />
      <HowItWorks />
      <Reviews />
      {piece ? (
        <PieceDetail piece={piece} onClose={() => setPiece(null)} />
      ) : null}
    </>
  );
}
