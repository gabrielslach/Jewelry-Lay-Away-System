import { describe, expect, it } from 'vitest';
import { presentPiece } from '../../src/services/presentPiece.js';

describe('presentPiece', () => {
  it('falls back when display fields are missing', () => {
    const piece = presentPiece({ id: 99, title: 'PJ1', price: '10', images: [] });
    expect(piece.name).toBe('PJ1');
    expect(piece.category).toBe('Jewelry');
  });
});
