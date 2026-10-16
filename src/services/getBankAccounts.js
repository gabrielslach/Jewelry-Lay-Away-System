import { request } from './http.js';

export async function getBankAccounts() {
  const data = await request('/api/bank-accounts');
  if (Array.isArray(data)) {
    return data;
  }
  return data.results ?? [];
}
