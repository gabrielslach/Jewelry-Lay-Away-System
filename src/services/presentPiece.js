import { formatPeso } from '../lib/money.js';

function text(value) {
  return value == null ? '' : String(value).trim();
}

function carats(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function sumCarats(entries) {
  return entries.reduce((total, entry) => total + carats(entry?.weight_ct), 0);
}

function countEntries(entries) {
  return entries.reduce((total, entry) => total + (entry?.count ?? 1), 0);
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function material({ metal, purity }) {
  const name = text(metal);
  const grade = text(purity);
  const compact = (value) => value.replace(/\s/g, '').toLowerCase();
  if (!grade || compact(name).includes(compact(grade))) return name || null;
  return name ? `${name} ${grade}` : grade;
}

function stone({ diamond_weight_ct, diamonds, stones }) {
  const diamondList = diamonds ?? [];
  const stoneList = stones ?? [];
  const diamondCarats = carats(diamond_weight_ct) || sumCarats(diamondList);
  const totalCarats = diamondCarats + sumCarats(stoneList);

  const counts = [
    [countEntries(diamondList), 'diamond'],
    [countEntries(stoneList), 'stone'],
  ]
    .filter(([count]) => count > 0)
    .map(([count, word]) => plural(count, word))
    .join(', ');
  const caratLabel = totalCarats > 0 ? `${totalCarats.toFixed(2)} ct` : '';

  if (counts) return [counts, caratLabel].filter(Boolean).join(' · ');
  return caratLabel ? `${caratLabel} diamond` : null;
}

function weight({ gold_weight_g }) {
  const grams = Number(text(gold_weight_g));
  if (!Number.isFinite(grams) || grams <= 0) return null;
  return `${Number(grams.toFixed(2))} g`;
}

export function presentPiece(item) {
  const details = item.details ?? {};
  const price = Number(item.price);
  return {
    id: item.id,
    title: item.title,
    name: item.name || item.title,
    category: text(details.category) || 'Jewelry',
    material: material(details),
    stone: stone(details),
    weight: weight(details),
    type: text(details.item_form) || null,
    price,
    currency: item.currency,
    inStock: item.in_stock,
    images: item.images ?? [],
    priceLabel: formatPeso(price),
  };
}
