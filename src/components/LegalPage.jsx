import { Children } from 'react';
import './LegalPage.css';

export function LegalSection({ id, title, children }) {
  return (
    <section>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

export default function LegalPage({ title, updated, children }) {
  const sections = Children.toArray(children)
    .filter((child) => child.type === LegalSection)
    .map((child) => child.props);

  return (
    <article className="page-block legal-page">
      <h1>{title}</h1>
      <p className="page-lead">Last updated: {updated}</p>
      <p className="legal-notice" role="note">
        Placeholder legal copy. This text has not been reviewed by a lawyer and
        must be reviewed before launch.
      </p>
      <nav aria-label="On this page" className="legal-contents">
        <ol>
          {sections.map(({ id, title: sectionTitle }) => (
            <li key={id}>
              <a href={`#${id}`}>{sectionTitle}</a>
            </li>
          ))}
        </ol>
      </nav>
      {children}
    </article>
  );
}
