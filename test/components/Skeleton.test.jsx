import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Skeleton, { Bone } from '../../src/components/Skeleton.jsx';

const skeletonCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../src/components/Skeleton.css'),
  'utf8',
);

describe('Skeleton', () => {
  it('exposes busy state and visually hidden Loading status', () => {
    render(
      <Skeleton>
        <Bone data-testid="bone" />
      </Skeleton>,
    );
    expect(document.querySelector('.skeleton[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('disables shimmer animation under prefers-reduced-motion', () => {
    expect(skeletonCss).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(skeletonCss).toMatch(/animation:\s*none/);
  });
});
