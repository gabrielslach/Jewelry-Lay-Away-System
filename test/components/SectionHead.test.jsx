import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SectionHead from '../../src/components/SectionHead.jsx';

describe('SectionHead', () => {
  it('renders the eyebrow, title, and supporting copy', () => {
    render(
      <SectionHead eyebrow="Collections" title="Handpicked Pieces">
        A sample of what is available.
      </SectionHead>,
    );
    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Handpicked Pieces' }),
    ).toBeInTheDocument();
    expect(screen.getByText('A sample of what is available.')).toBeInTheDocument();
  });
});
