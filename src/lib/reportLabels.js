export function agingLabel(key) {
  const range = /^days_(\d+)_(\d+)$/.exec(key);
  if (range) {
    return `${range[1]}-${range[2]} days`;
  }
  const open = /^days_(\d+)_plus$/.exec(key);
  return open ? `${open[1]}+ days` : key;
}

export function humanizeKey(key) {
  const words = String(key).replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function amountOf(value) {
  return value !== null && typeof value === 'object' ? value.amount : value;
}
