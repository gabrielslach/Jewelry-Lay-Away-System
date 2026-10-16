import './SectionHead.css';

export default function SectionHead({ eyebrow, title, children }) {
  return (
    <div className="section-head">
      <div className="eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  );
}
