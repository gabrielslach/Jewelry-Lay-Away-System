import { request } from './http.js';

export async function getLayawayPreview({ productId, termMonths } = {}) {
  const params = new URLSearchParams();
  if (productId != null) {
    params.set('product_id', String(productId));
  }
  if (termMonths != null) {
    params.set('term_months', String(termMonths));
  }
  const query = params.toString();
  return request(`/api/layaway/preview${query ? `?${query}` : ''}`);
}

/** Lowest installment amount on the longest allowed term; null if unavailable. */
export function lowestLongestTermPayment(preview) {
  if (!preview?.options?.length) {
    return null;
  }
  const option =
    preview.options.find((row) => row.term_months === preview.max_term_months) ??
    preview.options.reduce((best, row) =>
      !best || row.term_months > best.term_months ? row : best,
    );
  if (!option?.schedule?.length) {
    return null;
  }
  return Math.min(...option.schedule.map((row) => Number(row.amount)));
}
