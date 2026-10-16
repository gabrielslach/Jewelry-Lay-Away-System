import Button from './Button.jsx';
import './Hero.css';

const stats = ['Curated pieces', 'Up to 3 months', 'Every 15 days'];

export default function Hero() {
  return (
    <section className="hero" aria-label="Featured">
      <div className="hero-frame">
        <div className="hero-media">
          <img src={`${import.meta.env.BASE_URL}hero-1.png`} alt="" />
        </div>
        <div className="hero-copy">
          <div className="eyebrow">Paid Your Way</div>
          <h1>
            Reserve the Piece.
            <br />
            Pay on Your Terms.
          </h1>
          <p>
            Choose a piece, pay a down payment, and settle the balance in fixed
            installments every 15 days, for up to 3 months.
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
      </div>
    </section>
  );
}
