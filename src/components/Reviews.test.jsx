import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Reviews from './Reviews.jsx';

describe('Reviews', () => {
  it('renders three customer testimonials', () => {
    render(<Reviews />);
    expect(
      screen.getByRole('heading', { name: 'What Customers Say' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Sample Client')).toBeInTheDocument();
    expect(screen.getByText('Sample Buyer')).toBeInTheDocument();
    expect(screen.getByText('Sample User')).toBeInTheDocument();
  });
});
