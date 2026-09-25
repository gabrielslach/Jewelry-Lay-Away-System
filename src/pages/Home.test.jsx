import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './Home.jsx';

describe('Home', () => {
  it('renders the store name', () => {
    render(<Home />);
    expect(
      screen.getByRole('heading', { name: /sample jewelry co\./i }),
    ).toBeInTheDocument();
  });
});
