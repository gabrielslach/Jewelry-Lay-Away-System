import { describe, expect, it } from 'vitest';
import { presentPiece } from '../../src/services/presentPiece.js';

describe('presentPiece', () => {
  it('falls back when display fields are missing', () => {
    const piece = presentPiece({ id: 99, title: 'PJ1', price: '10', images: [] });
    expect(piece.name).toBe('PJ1');
    expect(piece.category).toBe('Jewelry');
    expect(piece.material).toBe('-');
    expect(piece.stone).toBe('-');
    expect(piece.size).toBe('-');
    expect(piece.cert).toBe('-');
  });

  it('maps omit, null, empty, and whitespace specs to hyphen-minus', () => {
    const omitted = presentPiece({ id: 1, title: 'T', price: '1' });
    expect(omitted.material).toBe('-');
    expect(omitted.stone).toBe('-');
    expect(omitted.size).toBe('-');
    expect(omitted.cert).toBe('-');

    const nulled = presentPiece({
      id: 2,
      title: 'T',
      price: '1',
      material: null,
      stone: null,
      size: null,
      cert: null,
    });
    expect(nulled.material).toBe('-');
    expect(nulled.stone).toBe('-');
    expect(nulled.size).toBe('-');
    expect(nulled.cert).toBe('-');

    const blank = presentPiece({
      id: 3,
      title: 'T',
      price: '1',
      material: '',
      stone: '   ',
      size: '\t',
      cert: ' \n ',
    });
    expect(blank.material).toBe('-');
    expect(blank.stone).toBe('-');
    expect(blank.size).toBe('-');
    expect(blank.cert).toBe('-');
  });

  it('keeps present values and name/category fallbacks', () => {
    const piece = presentPiece({
      id: 4,
      title: 'PJ17414',
      name: 'Solitaire Halo Ring',
      category: 'Rings',
      material: '18K White Gold',
      stone: '0.75ct Diamond',
      size: 'US 6 (resizable)',
      cert: 'GIA Certified',
      price: '48500',
      images: [{ url: 'https://cdn.example/a.jpg' }],
    });
    expect(piece.name).toBe('Solitaire Halo Ring');
    expect(piece.category).toBe('Rings');
    expect(piece.material).toBe('18K White Gold');
    expect(piece.stone).toBe('0.75ct Diamond');
    expect(piece.size).toBe('US 6 (resizable)');
    expect(piece.cert).toBe('GIA Certified');
    expect(piece.images).toEqual([{ url: 'https://cdn.example/a.jpg' }]);
  });

  it('uses title for name and Jewelry when category is absent', () => {
    const piece = presentPiece({ id: 5, title: 'PJ9', price: '10' });
    expect(piece.name).toBe('PJ9');
    expect(piece.category).toBe('Jewelry');
  });
});
