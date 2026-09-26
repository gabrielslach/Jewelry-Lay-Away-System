export function formatPeso(amount) {
  return `₱${Math.round(Number(amount)).toLocaleString('en-US')}`;
}

export function splitAmount(total, count) {
  const whole = Math.round(Number(total));
  const base = Math.floor(whole / count);
  const remainder = whole - base * count;
  return Array.from({ length: count }, (_, index) =>
    index === count - 1 ? base + remainder : base,
  );
}
