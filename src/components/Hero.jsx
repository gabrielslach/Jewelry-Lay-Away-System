import { useState } from 'react';
import Button from './Button.jsx';
import './Hero.css';

const SLIDE_COUNT = 3;
const SWIPE_PX = 48;

const stats = [
  { value: '3,000+', label: 'Pieces Available' },
  { value: '3 Mo.', label: 'Max Lay-Away Term' },
  { value: 'Your Dates', label: 'Flexible Due Days' },
];

const headline = 'Reserve the piece you love, pay for it on your schedule.';

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [touchX, setTouchX] = useState(null);

  function goTo(next) {
    setIndex(((next % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT);
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index + 1);
    }
  }

  function onTouchStart(event) {
    setTouchX(event.changedTouches[0].clientX);
  }

  function onTouchEnd(event) {
    if (touchX == null) {
      return;
    }
    const dx = event.changedTouches[0].clientX - touchX;
    setTouchX(null);
    if (dx <= -SWIPE_PX) {
      goTo(index + 1);
    } else if (dx >= SWIPE_PX) {
      goTo(index - 1);
    }
  }

  return (
    <section
      className="hero"
      role="region"
      aria-label="Featured"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="hero-frame">
        <div className="hero-media">
          {index === 0 ? <img src="/hero-1.png" alt="" /> : null}
          {index === 1 ? <img src="/hero-2.png" alt="" /> : null}
          {index === 2 ? <div className="hero-media-solid" /> : null}
        </div>
        <div className="hero-copy">
          {index === 0 ? (
            <>
              <div className="eyebrow">Fine Jewelry, Paid Your Way</div>
              <h1>{headline}</h1>
              <Button variant="primary" size="sm" to="/collections">
                Browse Collections
              </Button>
            </>
          ) : null}
          {index === 1 ? (
            <>
              <h1 className="visually-hidden">{headline}</h1>
              <p>
                Browse our curated jewelry collection and secure any piece with a
                flexible lay-away plan — up to 3 months, with payment dates you
                choose.
              </p>
              <Button variant="primary" size="sm" to="/collections">
                Start a Lay-Away
              </Button>
            </>
          ) : null}
          {index === 2 ? (
            <>
              <h1 className="visually-hidden">{headline}</h1>
              <div className="hero-stats">
                {stats.map((stat) => (
                  <div className="hero-stat" key={stat.label}>
                    <b>{stat.value}</b>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" to="/#how">
                See how it works
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <div className="hero-controls">
        <button
          type="button"
          className="hero-arrow"
          aria-label="Previous slide"
          onClick={() => goTo(index - 1)}
        >
          ‹
        </button>
        <div className="hero-dots">
          {Array.from({ length: SLIDE_COUNT }, (_, slide) => (
            <button
              key={slide}
              type="button"
              className="hero-dot"
              aria-label={`Show slide ${slide + 1} of ${SLIDE_COUNT}`}
              aria-current={slide === index ? 'true' : undefined}
              onClick={() => goTo(slide)}
            />
          ))}
        </div>
        <button
          type="button"
          className="hero-arrow"
          aria-label="Next slide"
          onClick={() => goTo(index + 1)}
        >
          ›
        </button>
      </div>
    </section>
  );
}
