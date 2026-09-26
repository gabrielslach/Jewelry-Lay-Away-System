import { formatPeso, splitAmount } from '../lib/money.js';

export function presentPiece(item) {
  const price = Number(item.price);
  return {
    id: item.id,
    title: item.title,
    name: item.name || item.title,
    category: item.category || 'Jewelry',
    material: item.material || '—',
    stone: item.stone || '—',
    size: item.size || '—',
    cert: item.cert || '—',
    price,
    currency: item.currency,
    inStock: item.in_stock,
    images: item.images ?? [],
    priceLabel: formatPeso(price),
    perPaymentLabel: formatPeso(splitAmount(price, 6)[0]),
  };
}
