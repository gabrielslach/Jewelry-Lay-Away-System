import { request } from './http.js';
import { getCustomerToken } from './session.js';

export async function mockGatewayPayment({ planId, method }) {
  return request(`/api/layaway/plans/${planId}/payments/mock-gateway`, {
    method: 'POST',
    token: getCustomerToken(),
    body: { method },
  });
}
