import SectionHead from './SectionHead.jsx';
import './HowItWorks.css';
import './SectionHead.css';

const steps = [
  {
    title: 'Choose Your Piece',
    body: "Browse the collection and pick the item you'd like to reserve.",
  },
  {
    title: 'Set Your Schedule',
    body: 'Pick a lay-away term of up to 3 months and choose the days that work for you.',
  },
  {
    title: 'Complete & Collect',
    body: 'Once your final payment clears, your piece is ready for pickup — reserved just for you.',
  },
];

export default function HowItWorks() {
  return (
    <section className="section how-section" id="how">
      <div className="container">
        <SectionHead eyebrow="How It Works" title="Own It Sooner, Pay Over Time" />
        <div className="steps">
          {steps.map((step, index) => (
            <div className="step" key={step.title}>
              <div className="step-num">{index + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
