import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HowItWorks from '../../src/components/HowItWorks.jsx';

describe('HowItWorks', () => {
  it('renders the three lay-away steps', () => {
    render(<HowItWorks />);
    expect(
      screen.getByRole('heading', { name: 'Own It Sooner, Pay Over Time' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Choose Your Piece' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Set Your Schedule' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Complete & Collect' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Pick a lay-away term of up to 3 months. Payments are every 15 days — pay by bank transfer.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/choose the days that work for you/i)).not.toBeInTheDocument();
  });
});
