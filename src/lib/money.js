export function formatPeso(amount) {
  return `₱${Math.round(Number(amount)).toLocaleString('en-US')}`;
}
