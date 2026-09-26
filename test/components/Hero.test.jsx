import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Hero from '../../src/components/Hero.jsx';

describe('Hero', () => {
  it('renders the headline, CTA, and stats', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', {
        name: /reserve the piece you love, pay for it on your schedule/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Collections' })).toHaveAttribute(
      'href',
      '/collections',
    );
    expect(screen.getByText('3,000+')).toBeInTheDocument();
    expect(screen.getByText('3 Mo.')).toBeInTheDocument();
    expect(screen.getByText('Your Dates')).toBeInTheDocument();
  });
});
