import Button from './Button.jsx';
import './Hero.css';

const stats = ['3,000+ pieces', 'Up to 3 months', 'Dates you choose'];

export default function Hero() {
  return (
    <section className="hero" aria-label="Featured">
      <div className="hero-frame">
        <div className="hero-copy">
          <div className="eyebrow">Paid Your Way</div>
          <h1>
            Reserve the Piece.
            <br />
            Pay on Your Terms.
          </h1>
          <p>
            Secure any jewelry with a flexible lay-away — up to 3 months, on dates
            you choose.
          </p>
          <Button variant="primary" to="/collections">
            Browse Collections
          </Button>
          <ul className="hero-stats" role="list">
            {stats.map((stat) => (
              <li key={stat}>{stat}</li>
            ))}
          </ul>
        </div>
        <div className="hero-media">
          <img src="/hero-1.png" alt="" />
        </div>
      </div>
    </section>
  );
}
