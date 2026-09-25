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
    category: 'Rings',
    material: '18K White Gold',
    stone: '0.75ct Diamond',
    size: 'US 6 (resizable)',
    cert: 'GIA Certified',
  },
  2: {
    name: 'Vintage Rose Pendant',
    category: 'Necklaces',
    material: '14K Rose Gold',
    stone: '0.40ct Diamond Cluster',
    size: '18in Chain',
    cert: 'In-house Appraisal',
  },
  3: {
    name: 'Emerald Drop Earrings',
    category: 'Earrings',
    material: '18K Yellow Gold',
    stone: 'Emerald & Diamond',
    size: 'Standard Post',
    cert: 'GIA Certified',
  },
  4: {
    name: 'Classic Tennis Bracelet',
    category: 'Bracelets',
    material: '14K White Gold',
    stone: '2.10ct Diamond (Total)',
    size: '7in, Adjustable',
    cert: 'GIA Certified',
  },
  5: {
    name: 'Sapphire Signet Ring',
    category: 'Rings',
    material: '18K Yellow Gold',
    stone: '1.2ct Sapphire',
    size: 'US 7 (resizable)',
    cert: 'In-house Appraisal',
  },
  6: {
    name: 'Pearl Drop Necklace',
    category: 'Necklaces',
    material: 'Sterling Silver',
    stone: 'Akoya Pearl',
    size: '16in Chain',
    cert: 'In-house Appraisal',
  },
};

export function presentPiece(item) {
  const extras = displayById[item.id] ?? {
    name: item.title,
    category: 'Jewelry',
    material: '—',
    stone: '—',
    size: '—',
    cert: '—',
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

export function getGalleryPiece(id) {
  const item = galleryPage.results.find((piece) => piece.id === Number(id));
  if (!item) {
    return Promise.resolve(null);
  }
  return Promise.resolve(presentPiece(item));
}
