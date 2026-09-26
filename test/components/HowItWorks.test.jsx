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
  });
});
