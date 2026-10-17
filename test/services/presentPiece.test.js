import { describe, expect, it } from 'vitest';
import { presentPiece } from '../../src/services/presentPiece.js';

const base = { id: 1, title: 'PJ1', price: '10', images: [] };
const present = (details) => presentPiece({ ...base, details });

describe('presentPiece', () => {
  it('maps full details', () => {
    const piece = presentPiece({
      ...base,
      id: 8109,
      details: {
        item_form: 'Necklaces (NL)',
        category: ' Gold Jewelry ',
        metal: 'Yellow gold 18K',
        purity: '18K',
        gold_weight_g: '9.850',
        diamond_weight_ct: null,
        diamonds: [],
        stones: [],
      },
    });
    expect(piece.name).toBe('PJ1');
    expect(piece.category).toBe('Gold Jewelry');
    expect(piece.material).toBe('Yellow gold 18K');
    expect(piece.weight).toBe('9.85 g');
    expect(piece.type).toBe('Necklaces (NL)');
    expect(piece.stone).toBeNull();
  });

  it('uses null specs and the Jewelry category when details are missing', () => {
    for (const details of [undefined, null, {}]) {
      const piece = present(details);
      expect(piece.category).toBe('Jewelry');
      expect([piece.material, piece.stone, piece.weight, piece.type]).toEqual([null, null, null, null]);
    }
  });

  describe('material', () => {
    it('appends purity only when the metal lacks it', () => {
      expect(present({ metal: 'Yellow gold', purity: '18K' }).material).toBe('Yellow gold 18K');
      expect(present({ metal: 'Yellow gold 18K', purity: '18k' }).material).toBe('Yellow gold 18K');
      expect(present({ metal: 'Gold 18 K', purity: '18K' }).material).toBe('Gold 18 K');
    });

    it('shows the metal alone when purity is empty', () => {
      expect(present({ metal: 'Yellow gold', purity: '' }).material).toBe('Yellow gold');
      expect(present({ metal: 'Yellow gold', purity: null }).material).toBe('Yellow gold');
    });

    it('handles empty purity and empty metal', () => {
      expect(present({ metal: 'Platinum', purity: '' }).material).toBe('Platinum');
      expect(present({ metal: null, purity: '14K' }).material).toBe('14K');
      expect(present({ metal: ' ', purity: null }).material).toBeNull();
    });
  });

  describe('stone', () => {
    it('shows counts and total carats', () => {
      const diamonds = [{ weight_ct: '0.25', count: 2 }];
      expect(present({ diamond_weight_ct: '0.50', diamonds }).stone).toBe('2 diamonds · 0.50 ct');
      expect(present({ diamonds: [{ weight_ct: '0.75', count: 1 }] }).stone).toBe(
        '1 diamond · 0.75 ct',
      );
      expect(present({ stones: [{ weight_ct: '1.2', count: 3 }] }).stone).toBe('3 stones · 1.20 ct');
    });

    it('combines diamonds and stones', () => {
      const details = {
        diamond_weight_ct: '0.50',
        diamonds: [{ weight_ct: '0.25', count: 2 }],
        stones: [{ weight_ct: '0.40', count: 1 }],
      };
      expect(present(details).stone).toBe('2 diamonds, 1 stone · 0.90 ct');
    });

    it('treats a null entry count as one and omits unknown carats', () => {
      expect(present({ diamonds: [{ weight_ct: null, count: null }] }).stone).toBe('1 diamond');
    });

    it('omits carats when diamond_weight_ct is null', () => {
      expect(present({ diamond_weight_ct: null, diamonds: [{ weight_ct: '0.3', count: 2 }] }).stone).toBe(
        '2 diamonds · 0.30 ct',
      );
      expect(present({ diamond_weight_ct: null, diamonds: [{ weight_ct: null, count: 2 }] }).stone).toBe(
        '2 diamonds',
      );
    });

    it('shows carats alone when there is no count', () => {
      expect(present({ diamond_weight_ct: '0.75' }).stone).toBe('0.75 ct diamond');
    });

    it('is null when nothing is known', () => {
      expect(present({ diamond_weight_ct: null, diamonds: [], stones: [] }).stone).toBeNull();
      expect(present({ diamond_weight_ct: '0' }).stone).toBeNull();
    });
  });

  describe('weight', () => {
    it('formats grams without trailing zeros', () => {
      expect(present({ gold_weight_g: '3.5' }).weight).toBe('3.5 g');
      expect(present({ gold_weight_g: '12.345' }).weight).toBe('12.35 g');
    });

    it('is null for empty, zero, or non-numeric values', () => {
      for (const gold_weight_g of [null, '', '0', '0.00', 'abc']) {
        expect(present({ gold_weight_g }).weight).toBeNull();
      }
    });
  });

  it('has a null type when item_form is empty', () => {
    expect(present({ item_form: ' ' }).type).toBeNull();
  });

  it('keeps the explicit name and falls back to the title', () => {
    expect(presentPiece({ ...base, name: 'Halo Ring' }).name).toBe('Halo Ring');
  });

  it('maps lowest_payment_amount, or null when the API omits it', () => {
    expect(presentPiece({ ...base, lowest_payment_amount: 4150 }).lowestPaymentAmount).toBe(4150);
    expect(presentPiece(base).lowestPaymentAmount).toBeNull();
  });
});
