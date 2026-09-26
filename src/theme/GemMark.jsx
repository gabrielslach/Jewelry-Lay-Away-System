import './assets.css';

export default function GemMark({ size = 70, title = 'Jewelry piece' }) {
  return (
    <svg
      className="gem-mark"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      role="img"
      aria-label={title}
    >
      <path d="M6 3h12l3 5-9 13L3 8Z" />
      <path d="M3 8h18" />
      <path d="M9 3 8 8l4 13 4-13-1-5" />
    </svg>
  );
}
