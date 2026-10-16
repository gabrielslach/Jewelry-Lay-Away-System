export function sortByValue(getValue) {
  return (a, b) => {
    const left = getValue(a.original);
    const right = getValue(b.original);
    if (left == null || right == null) {
      return (left == null) - (right == null);
    }
    return left < right ? -1 : left > right ? 1 : 0;
  };
}

export function idNumber(id) {
  return Number(String(id).replace(/\D/g, ''));
}
