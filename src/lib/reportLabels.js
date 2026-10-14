export function humanizeKey(key) {
  const words = String(key).replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function amountOf(value) {
  return value !== null && typeof value === 'object' ? value.amount : value;
}
