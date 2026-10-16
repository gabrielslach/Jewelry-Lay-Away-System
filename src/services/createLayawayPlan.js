import { customerRequest } from './customerRequest.js';

export async function createLayawayPlan({ productId, termMonths }) {
  return customerRequest('/api/layaway/plans', {
    method: 'POST',
    body: {
      product_id: productId,
      term_months: termMonths,
    },
  });
}
