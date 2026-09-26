import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
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
  it('shows the hook slide with heading, CTA, and first photo', () => {
    const { container } = renderHero();
    expect(
      screen.getByRole('heading', {
        name: /reserve the piece you love, pay for it on your schedule/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Collections' })).toHaveAttribute(
      'href',
      '/collections',
    );
    expect(container.querySelector('img')).toHaveAttribute('src', '/hero-1.png');
    expect(screen.queryByText('3,000+')).not.toBeInTheDocument();
  });

  it('shows the plan slide from next and from a dot', () => {
    const { container } = renderHero();
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(
      screen.getByText(/browse our curated jewelry collection/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start a Lay-Away' })).toHaveAttribute(
      'href',
      '/collections',
    );
    expect(container.querySelector('img')).toHaveAttribute('src', '/hero-2.png');
    expect(screen.queryByText('3,000+')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show slide 1 of 3' }));
    expect(screen.getByRole('link', { name: 'Browse Collections' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show slide 2 of 3' }));
    expect(screen.getByRole('link', { name: 'Start a Lay-Away' })).toBeInTheDocument();
  });

  it('shows stats and See how it works on slide 3', () => {
    const { container } = renderHero();
    fireEvent.click(screen.getByRole('button', { name: 'Show slide 3 of 3' }));
    expect(screen.getByText('3,000+')).toBeInTheDocument();
    expect(screen.getByText('3 Mo.')).toBeInTheDocument();
    expect(screen.getByText('Your Dates')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See how it works' })).toHaveAttribute(
      'href',
      '/#how',
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('moves with arrow keys when the carousel is focused', () => {
    renderHero();
    const carousel = screen.getByRole('region', { name: 'Featured' });
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expect(screen.getByRole('link', { name: 'Start a Lay-Away' })).toBeInTheDocument();
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expect(screen.getByRole('link', { name: 'Browse Collections' })).toBeInTheDocument();
  });

  it('wraps from last slide to first', () => {
    renderHero();
    fireEvent.click(screen.getByRole('button', { name: 'Show slide 3 of 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByRole('link', { name: 'Browse Collections' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(screen.getByRole('link', { name: 'See how it works' })).toBeInTheDocument();
  });
});
