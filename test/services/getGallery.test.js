import { describe, expect, it } from 'vitest';
import { getGallery } from '../../src/services/getGallery.js';
import { getGalleryPiece } from '../../src/services/getGalleryPiece.js';
import { presentPiece } from '../../src/services/presentPiece.js';

describe('gallery services', () => {
  it('presents a jewelry name and category instead of the barcode title', () => {
    const piece = presentPiece({
      id: 1,
      title: 'PJ17414',
      price: '48500',
      name: 'Solitaire Halo Ring',
      category: 'Rings',
    });
    expect(piece.name).toBe('Solitaire Halo Ring');
    expect(piece.category).toBe('Rings');
    expect(piece.price).toBe(48500);
  });

  it('returns a six-item home teaser', async () => {
    const page = await getGallery({ pageSize: 6 });
    expect(page.results).toHaveLength(6);
    expect(page.next).toContain('page=2');
  });

  it('loads a single piece', async () => {
    const page = await getGallery({ pageSize: 1 });
    const piece = await getGalleryPiece(page.results[0].id);
    expect(piece.name).toBe('Solitaire Halo Ring');
    expect(piece.images[0].url).toContain('digitaloceanspaces.com');
  });
});
