import { useRef, useState } from 'react';
import Modal from './Modal.jsx';
import PieceImage from './PieceImage.jsx';
import './ZoomableImage.css';

export default function ZoomableImage({ webSrc, originalSrc, name, number }) {
  const [webFailed, setWebFailed] = useState(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [originalFailed, setOriginalFailed] = useState(false);
  const triggerRef = useRef(null);
  const zoomable = Boolean(webSrc) && webFailed !== webSrc;

  function openZoom() {
    setLoaded(false);
    setOriginalFailed(false);
    setOpen(true);
  }

  function closeZoom() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="zoomable">
      <PieceImage
        src={webSrc}
        alt={`${name} photo ${number}`}
        title={name}
        loading="eager"
        onError={() => setWebFailed(webSrc)}
      />
      {zoomable ? (
        <button
          ref={triggerRef}
          type="button"
          className="zoom-trigger"
          aria-label={`Zoom photo ${number}: ${name}`}
          onClick={openZoom}
        >
          <span className="zoom-chip" aria-hidden="true">
            Tap to zoom
          </span>
        </button>
      ) : null}
      {open ? (
        <Modal title={name} onClose={closeZoom}>
          <div className="zoom-body">
            {originalFailed ? (
              <p>Original unavailable.</p>
            ) : (
              <>
                {loaded ? null : <img src={webSrc} alt="" />}
                <img
                  src={originalSrc}
                  alt={`${name} photo ${number}`}
                  hidden={!loaded}
                  onLoad={() => setLoaded(true)}
                  onError={() => setOriginalFailed(true)}
                />
              </>
            )}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
