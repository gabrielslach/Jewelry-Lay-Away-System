import Button from './Button.jsx';
import './Hero.css';

const stats = [
  { value: '3,000+', label: 'Pieces Available' },
  { value: '3 Mo.', label: 'Max Lay-Away Term' },
  { value: 'Your Dates', label: 'Flexible Due Days' },
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="eyebrow">Fine Jewelry, Paid Your Way</div>
      <h1>Reserve the piece you love, pay for it on your schedule.</h1>
      <p>
        Browse our curated jewelry collection and secure any piece with a flexible
        lay-away plan — up to 3 months, with payment dates you choose.
      </p>
      <Button to="/#collections">Browse Collections</Button>
      <div className="hero-stats">
        {stats.map((stat) => (
          <div className="hero-stat" key={stat.label}>
            <b>{stat.value}</b>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
