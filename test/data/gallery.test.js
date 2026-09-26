import { describe, expect, it } from 'vitest';
import { getGalleryPiece, presentPiece } from '../../src/data/gallery.js';
import { getGallery } from '../../src/data/gallery.js';

describe('gallery (legacy in-memory)', () => {
  it('still presents demo extras locally', () => {
    const piece = presentPiece({
      id: 1,
      title: 'PJ17414',
      price: '48500',
    });
    expect(piece.name).toBe('Solitaire Halo Ring');
  });

  it('returns a demo-sized first page', async () => {
    const page = await getGallery();
    expect(page.results).toHaveLength(6);
    expect(page.next).toBeNull();
  });

  it('finds a piece by id', async () => {
    const piece = await getGalleryPiece(1);
    expect(piece.id).toBe(1);
  });
});
