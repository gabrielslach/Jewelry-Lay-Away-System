export const galleryPage = {
  count: 6,
  next: null,
  previous: null,
  results: [
    { id: 1, title: 'PJ17414', price: '48500', currency: 'PHP', in_stock: true, images: [] },
    { id: 2, title: 'PJ17415', price: '32000', currency: 'PHP', in_stock: true, images: [] },
    { id: 3, title: 'PJ17416', price: '27500', currency: 'PHP', in_stock: true, images: [] },
    { id: 4, title: 'PJ17417', price: '65000', currency: 'PHP', in_stock: true, images: [] },
    { id: 5, title: 'PJ17418', price: '39900', currency: 'PHP', in_stock: true, images: [] },
    { id: 6, title: 'PJ17419', price: '21000', currency: 'PHP', in_stock: true, images: [] },
  ],
};

const displayById = {
  1: {
    name: 'Solitaire Halo Ring',
    details: {
      item_form: 'Rings (RG)',
      category: 'Gold Jewelry',
      metal: 'White gold 18K',
      purity: '18K',
      gold_weight_g: '4.20',
      diamond_weight_ct: '0.75',
      diamonds: [{ weight_ct: '0.75', count: 1 }],
      stones: [],
    },
  },
  2: {
    name: 'Vintage Rose Pendant',
    details: {
      item_form: 'Necklaces (NL)',
      category: 'Gold Jewelry',
      metal: 'Rose gold 14K',
      purity: '14K',
      gold_weight_g: '3.10',
      diamond_weight_ct: '0.40',
      diamonds: [{ weight_ct: '0.40', count: 1 }],
      stones: [],
    },
  },
  3: {
    name: 'Emerald Drop Earrings',
    details: {
      item_form: 'Earrings (ER)',
      category: 'Gold Jewelry',
      metal: 'Yellow gold 18K',
      purity: '18K',
      gold_weight_g: '5.60',
      diamond_weight_ct: null,
      diamonds: [{ weight_ct: '0.30', count: 2 }],
      stones: [{ weight_ct: '1.20', count: 2 }],
    },
  },
  4: {
    name: 'Classic Tennis Bracelet',
    details: {
      item_form: 'Bracelets (BR)',
      category: 'Gold Jewelry',
      metal: 'White gold 14K',
      purity: '14K',
      gold_weight_g: '11.40',
      diamond_weight_ct: '2.10',
      diamonds: [{ weight_ct: '2.10', count: 30 }],
      stones: [],
    },
  },
  5: {
    name: 'Sapphire Signet Ring',
    details: {
      item_form: 'Rings (RG)',
      category: 'Gold Jewelry',
      metal: 'Yellow gold 18K',
      purity: '18K',
      gold_weight_g: '6.80',
      diamond_weight_ct: null,
      diamonds: [],
      stones: [{ weight_ct: '1.20', count: 1 }],
    },
  },
  6: {
    name: 'Pearl Drop Necklace',
    details: {
      item_form: 'Necklaces (NL)',
      category: 'Silver Jewelry',
      metal: 'Sterling silver',
      purity: null,
      gold_weight_g: null,
      diamond_weight_ct: null,
      diamonds: [],
      stones: [],
    },
  },
};

export function presentPiece(item) {
  const extras = displayById[item.id] ?? { name: item.title, details: null };
  return {
    ...item,
    price: Number(item.price),
    lowestPaymentAmount: item.lowest_payment_amount ?? null,
    ...extras,
  };
}

export function getGallery() {
  return Promise.resolve({
    ...galleryPage,
    results: galleryPage.results.map(presentPiece),
  });
}

export function getGalleryPiece(id) {
  const item = galleryPage.results.find((piece) => piece.id === Number(id));
  if (!item) {
    return Promise.resolve(null);
  }
  return Promise.resolve(presentPiece(item));
}
