import { customerRequest } from './customerRequest.js';

export async function mockGatewayPayment({ planId, method }) {
  return customerRequest(`/api/layaway/plans/${planId}/payments/mock-gateway`, {
    method: 'POST',
    body: { method },
  });
}
