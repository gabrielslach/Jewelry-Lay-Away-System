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
  1: { name: 'Solitaire Halo Ring', category: 'Rings' },
  2: { name: 'Vintage Rose Pendant', category: 'Necklaces' },
  3: { name: 'Emerald Drop Earrings', category: 'Earrings' },
  4: { name: 'Classic Tennis Bracelet', category: 'Bracelets' },
  5: { name: 'Sapphire Signet Ring', category: 'Rings' },
  6: { name: 'Pearl Drop Necklace', category: 'Necklaces' },
};

export function presentPiece(item) {
  const extras = displayById[item.id] ?? {
    name: item.title,
    category: 'Jewelry',
  };
  return {
    ...item,
    price: Number(item.price),
    ...extras,
  };
}

export function getGallery() {
  return Promise.resolve({
    ...galleryPage,
    results: galleryPage.results.map(presentPiece),
  });
}
