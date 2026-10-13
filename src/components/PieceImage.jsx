import { useState } from 'react';
import { GemMark } from '../theme/assets.js';

export default function PieceImage({ src, alt = '', title, size = 70, loading = 'lazy', onError }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = Boolean(src) && failedSrc === src;

  if (!src || failed) {
    return <GemMark size={size} title={title} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => {
        setFailedSrc(src);
        onError?.();
      }}
    />
  );
}
