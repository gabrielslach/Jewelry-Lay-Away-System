import {
  buildCatalog,
  initialAdmin,
  initialBankAccounts,
  initialCompletedPlan,
  initialCustomers,
  initialPlans,
  initialSettings,
} from './seed.js';

export function createStore() {
  const catalog = buildCatalog();
  return {
    catalog,
    customers: initialCustomers(),
    admin: initialAdmin(),
    plans: [...initialPlans(catalog), initialCompletedPlan(catalog)],
    bankAccounts: initialBankAccounts(),
    settings: initialSettings(),
    tokens: new Map(),
    rate: new Map(),
    ledger: [],
    markupRules: [],
    penaltyRules: [],
    pendingPayments: [],
    nextCustomerId: 6,
    nextPlanSeq: 1006,
    nextPaymentId: 1,
    now: () => new Date(),
  };
}

export function publicCustomer(customer) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    member_since: customer.member_since,
  };
}

export function publicAdmin(admin) {
  return { id: admin.id, name: admin.name, email: admin.email };
}

export function issueToken(store, kind, id) {
  const token = `${kind}-${id}-${store.tokens.size + 1}`;
  store.tokens.set(token, { kind, id });
  return token;
}

export function readToken(store, header) {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return store.tokens.get(header.slice(7)) ?? null;
}

export function hitRate(store, key) {
  const windowMs = 15 * 60 * 1000;
  const now = store.now().getTime();
  const times = (store.rate.get(key) ?? []).filter((t) => now - t < windowMs);
  if (times.length >= 10) {
    store.rate.set(key, times);
    return true;
  }
  times.push(now);
  store.rate.set(key, times);
  return false;
}
