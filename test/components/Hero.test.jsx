import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Hero from '../../src/components/Hero.jsx';

function renderHero() {
  return render(
    <MemoryRouter>
      <Hero />
    </MemoryRouter>,
  );
}

describe('Hero', () => {
  it('shows the approved copy, CTA, stats, and still-life', () => {
    const { container } = renderHero();
    expect(screen.getByText('Paid Your Way')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /reserve the piece\.\s*pay on your terms\./i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /secure any jewelry with a flexible lay-away — up to 3 months, on dates you choose/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Collections' })).toHaveAttribute(
      'href',
      '/collections',
    );
    expect(screen.getByText('3,000+ pieces')).toBeInTheDocument();
    expect(screen.getByText('Up to 3 months')).toBeInTheDocument();
    expect(screen.getByText('Dates you choose')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', '/hero-1.png');
    expect(
      screen.queryByRole('button', { name: /slide/i }),
    ).not.toBeInTheDocument();
  });
});
