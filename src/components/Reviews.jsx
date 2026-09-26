import SectionHead from './SectionHead.jsx';
import './Reviews.css';
import './SectionHead.css';

const reviews = [
  {
    quote:
      '"I reserved a piece for our anniversary and paid it off over two months — so much easier than saving up first."',
    initials: 'SC',
    name: 'Sample Client',
  },
  {
    quote:
      '"Loved being able to choose my own payment dates around payday. The process was simple from start to finish."',
    initials: 'SB',
    name: 'Sample Buyer',
  },
  {
    quote:
      '"The staff kept me updated on my balance the whole way through. Picked up my ring right on schedule."',
    initials: 'SU',
    name: 'Sample User',
  },
];

export default function Reviews() {
  return (
    <section className="section" id="reviews">
      <div className="container">
        <SectionHead eyebrow="Reviews" title="What Customers Say" />
        <div className="testi-grid">
          {reviews.map((review) => (
            <div className="testi" key={review.name}>
              <p>{review.quote}</p>
              <div className="testi-who">
                <div className="avatar">{review.initials}</div>
                <div>
                  <b>{review.name}</b>
                  <span>Verified Buyer</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
