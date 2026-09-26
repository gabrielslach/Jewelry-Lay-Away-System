import { describe, expect, it } from 'vitest';
import { getGallery, getGalleryPiece, presentPiece } from '../../src/data/gallery.js';

describe('gallery', () => {
  it('presents a jewelry name and category instead of the barcode title', () => {
    const piece = presentPiece({
      id: 1,
      title: 'PJ17414',
      price: '48500',
    });
    expect(piece.name).toBe('Solitaire Halo Ring');
    expect(piece.category).toBe('Rings');
    expect(piece.price).toBe(48500);
  });

  it('returns a demo-sized first page', async () => {
    const page = await getGallery();
    expect(page.results).toHaveLength(6);
    expect(page.next).toBeNull();
  });

  it('looks up a single piece with mocked specs', async () => {
    const piece = await getGalleryPiece(1);
    expect(piece.material).toBe('18K White Gold');
  });
});
