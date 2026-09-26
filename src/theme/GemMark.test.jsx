import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GemMark from './GemMark.jsx';

describe('GemMark', () => {
  it('exposes an accessible name', () => {
    render(<GemMark />);
    expect(screen.getByRole('img', { name: 'Jewelry piece' })).toBeInTheDocument();
  });
});
