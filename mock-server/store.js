import {
  buildCatalog,
  initialAdmin,
  initialBankAccounts,
  initialClosedPlans,
  initialCompletedPlan,
  initialCustomers,
  initialPlans,
  initialSettings,
  initialStaff,
} from './seed.js';

export function createStore() {
  const catalog = buildCatalog();
  const admin = initialAdmin();
  return {
    catalog,
    customers: initialCustomers(),
    admin,
    staff: initialStaff(admin),
    plans: [
      ...initialPlans(catalog),
      initialCompletedPlan(catalog),
      ...initialClosedPlans(catalog),
    ],
    bankAccounts: initialBankAccounts(),
    settings: initialSettings(),
    tokens: new Map(),
    nextTokenId: 1,
    rate: new Map(),
    ledger: [],
    markupRules: [],
    penaltyRules: [],
    pendingPayments: [],
    usedReferences: new Set(),
    customerNotifications: [],
    adminNotifications: [],
    passwordResetTokens: new Map(),
    nextCustomerId: 6,
    nextStaffId: 3,
    nextPlanSeq: 1006,
    nextPaymentId: 1,
    nextNotificationId: 1,
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
    created_at: customer.created_at,
  };
}

export function publicAdmin(admin) {
  return { id: admin.id, name: admin.name, email: admin.email, role: admin.role ?? 'admin' };
}

export function publicStaff(member) {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    is_active: member.is_active,
    created_by: member.created_by,
    created_at: member.created_at,
  };
}

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 24 * 60 * 60 * 1000;

export function issueToken(store, kind, id, ttlMs = null) {
  const token = `${kind}-${id}-${store.nextTokenId}`;
  store.nextTokenId += 1;
  const expiresAt = ttlMs === null ? null : store.now().getTime() + ttlMs;
  store.tokens.set(token, { kind, id, expiresAt });
  return token;
}

export function issueAccessToken(store, customerId) {
  return issueToken(store, 'customer', customerId, ACCESS_TTL_MS);
}

export function issueAdminAccessToken(store, adminId) {
  return issueToken(store, 'admin', adminId, ACCESS_TTL_MS);
}

export function issueCustomerSession(store, customer) {
  return {
    access_token: issueAccessToken(store, customer.id),
    refresh_token: issueToken(store, 'refresh', customer.id, REFRESH_TTL_MS),
    customer: publicCustomer(customer),
  };
}

export function issueAdminSession(store, admin) {
  return {
    access_token: issueAdminAccessToken(store, admin.id),
    refresh_token: issueToken(store, 'admin_refresh', admin.id, REFRESH_TTL_MS),
    admin: publicAdmin(admin),
  };
}

function liveToken(store, token) {
  const entry = store.tokens.get(token);
  if (!entry || (entry.expiresAt !== null && store.now().getTime() >= entry.expiresAt)) {
    return null;
  }
  return entry;
}

export function readToken(store, header) {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return liveToken(store, header.slice(7));
}

export function readRefreshToken(store, token) {
  const entry = liveToken(store, token);
  return entry?.kind === 'refresh' ? entry : null;
}

export function readAdminRefreshToken(store, token) {
  const entry = liveToken(store, token);
  return entry?.kind === 'admin_refresh' ? entry : null;
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
