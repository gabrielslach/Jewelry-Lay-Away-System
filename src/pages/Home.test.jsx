import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './Home.jsx';

describe('Home', () => {
  it('renders the hero headline', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', {
        name: /reserve the piece you love/i,
      }),
    ).toBeInTheDocument();
  });
});
