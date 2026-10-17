import {
  confirmPayment,
  createPlanFromProduct,
  handleEpicRoutes,
  paymentFieldErrors,
  pendingRow,
  previewLayaway,
  pushAdminNotification,
  rejectPayment,
} from './epicRoutes.js';
import { handleBankAccountRoutes, handleFinanceRoutes } from './financeRoutes.js';
import { handleStaffRoutes } from './staffRoutes.js';
import {
  createStore,
  hitRate,
  issueAccessToken,
  issueAdminAccessToken,
  issueAdminSession,
  issueCustomerSession,
  publicCustomer,
  readAdminRefreshToken,
  readRefreshToken,
  readToken,
} from './store.js';

export { createStore };

function json(status, body) {
  return { status, body, headers: { 'Content-Type': 'application/json; charset=utf-8' } };
}

const PLACEHOLDER_PROOF_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="#B98B2E"/></svg>';

function binary(status, body, contentType) {
  return {
    status,
    body,
    headers: { 'Content-Type': contentType },
    binary: true,
  };
}

function todayIso(store) {
  return store.now().toISOString().slice(0, 10);
}

function refreshPlan(store, plan) {
  const today = todayIso(store);
  for (const installment of plan.installments) {
    if (
      (installment.status === 'pending' || installment.status === 'rejected') &&
      installment.due_date < today
    ) {
      installment.status = 'overdue';
    }
  }
  const overdue = plan.installments.filter((i) => i.status === 'overdue').length;
  const pending = plan.installments.filter((i) => i.status === 'pending').length;
  const paid = plan.installments.filter((i) => i.status === 'paid').length;
  plan.overdue_count = overdue;
  plan.pending_count = pending;
  plan.paid_count = paid;
  if (plan.closed_status) {
    plan.next_due = null;
  } else if (!plan.completed) {
    const next = plan.installments.find((i) => i.status === 'pending' || i.status === 'overdue');
    plan.next_due = next?.due_date ?? null;
    plan.list_status = plan.force_on_track
      ? 'ok'
      : next?.status === 'overdue'
        ? 'warn'
        : 'ok';
  }
  return plan;
}

function isOpen(plan) {
  return !plan.completed && !plan.closed_status;
}

function findPlan(store, id) {
  const raw = String(id);
  return store.plans.find((plan) => {
    const planId = String(plan.id);
    if (planId === raw) {
      return true;
    }
    const numeric = String(orderNumericId(plan.id));
    return numeric === raw || planId === `LA-${raw}` || `LA-${numeric}` === raw;
  });
}

function customerById(store, id) {
  return store.customers.find((c) => c.id === Number(id));
}

function requireCustomer(store, headers) {
  const auth = readToken(store, headers.authorization || headers.Authorization);
  if (!auth || auth.kind !== 'customer') {
    return { error: json(401, { error: 'Unauthorized' }) };
  }
  const customer = customerById(store, auth.id);
  if (!customer) {
    return { error: json(401, { error: 'Unauthorized' }) };
  }
  return { customer };
}

function requireAdmin(store, headers) {
  const auth = readToken(store, headers.authorization || headers.Authorization);
  const admin = auth?.kind === 'admin' && store.staff.find((member) => member.id === auth.id);
  if (!admin || !admin.is_active) {
    return { error: json(401, { error: 'Unauthorized' }) };
  }
  return { admin };
}

function galleryItem(piece) {
  return {
    id: piece.id,
    title: piece.title,
    price: piece.price,
    currency: piece.currency,
    in_stock: piece.in_stock,
    images: piece.images,
    name: piece.name,
    details: piece.details,
  };
}

function asIso(value) {
  if (!value) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000Z`;
  }
  return value;
}

function orderNumericId(id) {
  const digits = String(id).match(/\d+/);
  return digits ? Number(digits[0]) : id;
}

function listStatusToContract(plan) {
  if (plan.completed) {
    return 'completed';
  }
  if (plan.closed_status) {
    return plan.closed_status;
  }
  return plan.list_status === 'warn' ? 'overdue' : 'on_track';
}

function paymentStatus(row) {
  if (row.status === 'paid') {
    return 'paid';
  }
  if (row.status === 'submitted') {
    return 'awaiting_confirmation';
  }
  return row.rejection_reason ? 'rejected' : 'unpaid';
}

function orderMoney(plan) {
  const live = plan.installments.filter((row) => row.status !== 'superseded');
  const installmentTotal = live.reduce((sum, row) => sum + Number(row.amount), 0);
  const paidInstallments = live
    .filter((row) => row.status === 'paid')
    .reduce((sum, row) => sum + Number(row.amount), 0);
  const downPayment = Number(plan.down_payment_amount ?? 0);
  return {
    total_payable: downPayment + installmentTotal,
    amount_paid: (plan.down_payment_status === 'paid' ? downPayment : 0) + paidInstallments,
  };
}

function orderView(store, plan) {
  refreshPlan(store, plan);
  const product = store.catalog.find((p) => p.id === plan.product_id);
  const image = product?.images?.find((img) => img.is_primary) ?? product?.images?.[0];
  return {
    ...orderMoney(plan),
    as_of: todayIso(store),
    image_url: image?.url ?? null,
    financed_principal: plan.financed_principal ?? null,
    id: orderNumericId(plan.id),
    item_name: plan.item_name,
    term_months: plan.term_months,
    plan_label: plan.plan_label,
    installment_count: plan.installments.length,
    next_due_date: asIso(plan.next_due),
    next_due: plan.next_due,
    total_price: plan.total_price,
    down_payment_amount: plan.down_payment_amount,
    down_payment_status: plan.down_payment_status ?? 'pending',
    down_payment_rejection_reason: plan.down_payment_rejection_reason ?? null,
    reservation_status: plan.reservation_status ?? 'none',
    grace_period_days: plan.grace_period_days ?? store.settings.grace_period_days ?? null,
    currency: plan.currency,
    status: listStatusToContract(plan),
    plan_status: plan.completed || plan.closed_status ? listStatusToContract(plan) : 'active',
    completed_on: plan.completed ? asIso(plan.completed_on) : null,
    created_at: asIso(plan.created_at) ?? '2026-01-15T00:00:00.000Z',
    installments: plan.installments.map((row, index) => ({
      id: row.id,
      term_number: row.term_number ?? index + 1,
      due_date: asIso(row.due_date),
      amount: row.amount,
      status: row.status,
      payment_status: paymentStatus(row),
      paid_at: asIso(row.paid_at),
      rejection_reason: row.rejection_reason ?? null,
    })),
  };
}

function adminPlanView(store, plan) {
  refreshPlan(store, plan);
  const customer = customerById(store, plan.customer_id);
  return {
    id: plan.id,
    customer_name: customer?.name,
    customer_email: customer?.email,
    overdue_count: plan.overdue_count,
    pending_count: plan.pending_count,
    paid_count: plan.paid_count,
    item_name: plan.item_name,
    plan_label: plan.plan_label,
    next_due: plan.next_due,
    status: listStatusToContract(plan),
    created_at: asIso(plan.created_at) ?? '2026-01-15T00:00:00.000Z',
    total_price: plan.total_price,
    financed_principal: plan.financed_principal,
    down_payment_amount: plan.down_payment_amount,
    customer_id: plan.customer_id,
    reservation_status: plan.reservation_status ?? 'none',
    reservation_error: plan.reservation_error ?? null,
    down_payment_confirmed_at: plan.down_payment_confirmed_at ?? null,
    installments: plan.installments,
  };
}

function parsePath(url) {
  const parsed = new URL(url, 'http://mock.local');
  return { path: parsed.pathname.replace(/\/$/, '') || '/', query: parsed.searchParams };
}

function match(path, pattern) {
  const keys = [];
  const regex = new RegExp(
    `^${pattern.replace(/:([a-zA-Z_]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    })}$`,
  );
  const hit = path.match(regex);
  if (!hit) {
    return null;
  }
  const params = {};
  keys.forEach((key, index) => {
    params[key] = decodeURIComponent(hit[index + 1]);
  });
  return params;
}

export function handleRequest(store, { method, url, headers = {}, body, ip = '127.0.0.1' }) {
  const { path, query } = parsePath(url);
  const verb = method.toUpperCase();

  if (verb === 'GET' && path === '/api/gallery') {
    const page = Math.max(1, Number(query.get('page') || 1));
    const pageSize = Math.max(1, Number(query.get('page_size') || 12));
    const start = (page - 1) * pageSize;
    const results = store.catalog.slice(start, start + pageSize).map(galleryItem);
    const count = store.catalog.length;
    const next =
      start + pageSize < count
        ? `/api/gallery?page=${page + 1}&page_size=${pageSize}`
        : null;
    const previous =
      page > 1 ? `/api/gallery?page=${page - 1}&page_size=${pageSize}` : null;
    return json(200, { count, next, previous, results });
  }

  let params = match(path, '/api/gallery/:id');
  if (verb === 'GET' && params) {
    const piece = store.catalog.find((p) => p.id === Number(params.id));
    if (!piece) {
      return json(404, { error: 'Not found' });
    }
    return json(200, galleryItem(piece));
  }

  if (verb === 'POST' && path === '/api/customers/register') {
    if (hitRate(store, `${ip}:register`)) {
      return json(429, { error: 'too many attempts' });
    }
    const email = body?.email?.trim();
    if (!email || !body?.password || !body?.name) {
      return json(400, { error: 'name, email, and password are required' });
    }
    if (store.customers.some((c) => c.email === email)) {
      return json(400, { error: 'email already registered' });
    }
    const customer = {
      id: store.nextCustomerId,
      name: body.name,
      email,
      password: body.password,
      phone: body.phone || '',
      member_since: store.now().toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      created_at: store.now().toISOString(),
    };
    store.nextCustomerId += 1;
    store.customers.push(customer);
    return json(201, issueCustomerSession(store, customer));
  }

  if (verb === 'POST' && path === '/api/customers/login') {
    if (hitRate(store, `${ip}:login`)) {
      return json(429, { error: 'too many attempts' });
    }
    const customer = store.customers.find(
      (c) => c.email === body?.email && c.password === body?.password,
    );
    if (!customer) {
      return json(401, { error: 'Invalid credentials' });
    }
    return json(200, issueCustomerSession(store, customer));
  }

  if (verb === 'POST' && path === '/api/customers/refresh') {
    const entry = readRefreshToken(store, body?.refresh_token);
    if (!entry) {
      return json(401, { error: 'Unauthorized' });
    }
    return json(200, { access_token: issueAccessToken(store, entry.id) });
  }

  if (verb === 'POST' && path === '/api/customers/logout') {
    if (store.tokens.get(body?.refresh_token)?.kind === 'refresh') {
      store.tokens.delete(body.refresh_token);
    }
    return json(200, { ok: true });
  }

  if (verb === 'GET' && path === '/api/customers/orders') {
    const gate = requireCustomer(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const orders = store.plans
      .filter((p) => p.customer_id === gate.customer.id)
      .map((p) => orderView(store, p));
    return json(200, orders);
  }

  if (verb === 'GET' && path === '/api/layaway/preview') {
    return previewLayaway(store, query, { json });
  }

  if (verb === 'POST' && path === '/api/layaway/plans') {
    const gate = requireCustomer(store, headers);
    if (gate.error) {
      return gate.error;
    }
    return createPlanFromProduct(store, gate, body, {
      json,
      refreshPlan,
    });
  }

  params = match(path, '/api/layaway/plans/:id/payments/manual');
  if (verb === 'POST' && params) {
    const gate = requireCustomer(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const plan = findPlan(store, params.id);
    if (!plan || plan.customer_id !== gate.customer.id) {
      return json(404, { error: 'Not found' });
    }
    if (plan.completed || plan.closed_status) {
      return json(409, { error: `Plan is ${listStatusToContract(plan)}` });
    }
    const fieldError = paymentFieldErrors(body, store);
    if (fieldError) {
      const status = fieldError.includes('reference') ? 409 : 400;
      return json(status, { error: fieldError });
    }
    const inst = plan.installments.find(
      (i) =>
        String(i.id) === String(body.installment_id) ||
        String(i.term_number) === String(body.installment_id),
    );
    if (!inst) {
      return json(400, { error: 'installment_id required' });
    }
    if (inst.status === 'submitted') {
      return json(409, { error: 'Payment already awaiting confirmation' });
    }
    const earlierUnpaid = plan.installments
      .slice(0, plan.installments.indexOf(inst))
      .some((i) => i.status !== 'superseded' && i.status !== 'paid' && i.status !== 'submitted');
    if (earlierUnpaid) {
      return json(409, { error: 'Pay the earlier installment first' });
    }
    store.usedReferences.add(body.reference_number.trim());
    const payment = {
      id: store.nextPaymentId,
      kind: 'installment',
      plan_id: plan.id,
      installment_id: inst.id,
      term_number: inst.term_number,
      due_date: inst.due_date,
      status: 'submitted',
      expected_amount: inst.amount,
      amount_submitted: body.amount,
      reference_number: body.reference_number.trim(),
      paid_on: body.paid_on,
      proof_of_payment_url: body.proof_of_payment ? '/placeholders/1.svg' : null,
      created_at: store.now().toISOString(),
    };
    store.nextPaymentId += 1;
    store.pendingPayments.push(payment);
    inst.status = 'submitted';
    pushAdminNotification(store, {
      kind: 'payment_submitted',
      title: 'Installment submitted',
      body: `${gate.customer.name} submitted payment ${inst.term_number} for ${plan.id}.`,
      plan_id: plan.id,
      payment_id: payment.id,
    });
    return json(201, {
      id: payment.id,
      status: 'submitted',
      amount_matches_expected: Number(body.amount) === Number(inst.amount),
      note: 'Awaiting admin confirmation',
    });
  }

  params = match(path, '/api/layaway/plans/:id/payments/mock-gateway');
  if (verb === 'POST' && params) {
    const gate = requireCustomer(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const plan = findPlan(store, params.id);
    if (!plan || plan.customer_id !== gate.customer.id) {
      return json(404, { error: 'Not found' });
    }
    const method = body?.method === 'ewallet' ? 'gcash' : body?.method;
    if (method !== 'gcash' && method !== 'card') {
      return json(400, { error: 'method must be gcash or card' });
    }
    return json(200, { id: plan.id, status: 'reserved', method });
  }

  params = match(path, '/api/layaway/plans/:id/payments');
  if (verb === 'POST' && params) {
    return json(501, { error: 'Gateway not available' });
  }

  params = match(path, '/api/layaway/plans/:id');
  if (verb === 'GET' && params) {
    const auth = readToken(store, headers.authorization || headers.Authorization);
    if (!auth) {
      return json(401, { error: 'Unauthorized' });
    }
    const plan = findPlan(store, params.id);
    if (!plan) {
      return json(404, { error: 'Not found' });
    }
    if (auth.kind === 'customer' && plan.customer_id !== auth.id) {
      return json(403, { error: 'Forbidden' });
    }
    refreshPlan(store, plan);
    return json(200, {
      id: plan.id,
      total_price: plan.total_price,
      currency: plan.currency,
      term_months: plan.term_months,
      installments: plan.installments.map((row) => ({ ...row, payment_status: paymentStatus(row) })),
      status: plan.completed || plan.closed_status ? listStatusToContract(plan) : plan.list_status,
      item_name: plan.item_name,
      plan_label: plan.plan_label,
      reservation_status: plan.reservation_status ?? 'none',
      note: plan.note,
    });
  }

  if (verb === 'GET' && path === '/api/bank-accounts') {
    return json(200, { results: store.bankAccounts.filter((account) => account.is_active) });
  }

  if (verb === 'POST' && path === '/api/dev/session/customer') {
    const email = body?.email || 'client@sampleemail.com';
    const customer = store.customers.find((c) => c.email === email);
    if (!customer) {
      return json(404, { error: 'Customer not found' });
    }
    return json(200, issueCustomerSession(store, customer));
  }

  if (verb === 'POST' && path === '/api/dev/session/admin') {
    return json(200, issueAdminSession(store, store.admin));
  }

  if (verb === 'POST' && path === '/api/admin/login') {
    if (hitRate(store, `${ip}:admin-login`)) {
      return json(429, { error: 'too many attempts' });
    }
    const member = store.staff.find((m) => m.email === body?.email && m.is_active);
    if (!member || member.password !== body?.password) {
      return json(401, { error: 'Invalid credentials' });
    }
    return json(200, issueAdminSession(store, member));
  }

  if (verb === 'POST' && path === '/api/admin/refresh') {
    const entry = readAdminRefreshToken(store, body?.refresh_token);
    if (!entry) {
      return json(401, { error: 'Unauthorized' });
    }
    return json(200, { access_token: issueAdminAccessToken(store, entry.id) });
  }

  if (verb === 'POST' && path === '/api/admin/logout') {
    if (store.tokens.get(body?.refresh_token)?.kind === 'admin_refresh') {
      store.tokens.delete(body.refresh_token);
    }
    return json(200, { ok: true });
  }

  const financeHelpers = {
    json,
    requireAdmin,
    match,
    findPlan,
    refreshPlan,
    customerById,
  };
  const finance =
    handleFinanceRoutes(store, { verb, path, query, headers }, financeHelpers) ??
    handleBankAccountRoutes(store, { verb, path, body, headers }, financeHelpers);
  if (finance) {
    return finance;
  }

  if (path === '/api/admin/staff' || match(path, '/api/admin/staff/:id')) {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    if (gate.admin.role !== 'admin') {
      return json(403, { error: 'Forbidden' });
    }
    return handleStaffRoutes(store, { verb, path, body, admin: gate.admin }, { json, match });
  }

  if (verb === 'GET' && path === '/api/admin/plans') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    return json(200, {
      results: store.plans.filter((p) => !p.completed).map((p) => adminPlanView(store, p)),
    });
  }

  if (verb === 'GET' && path === '/api/admin/markup-rules') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    return json(200, { results: store.markupRules });
  }

  if (verb === 'POST' && path === '/api/admin/markup-rules') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    store.markupRules.push(body ?? {});
    return json(201, body ?? {});
  }

  if (verb === 'GET' && path === '/api/admin/penalty-rules') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    return json(200, { results: store.penaltyRules });
  }

  if (verb === 'POST' && path === '/api/admin/penalty-rules') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    store.penaltyRules.push(body ?? {});
    return json(201, body ?? {});
  }

  if (verb === 'GET' && path === '/api/admin/payments/pending') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const results = store.pendingPayments
      .filter((p) => p.status === 'submitted')
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
      .map((payment) => pendingRow(store, payment));
    return json(200, { results });
  }

  params = match(path, '/api/admin/payments/:id/proof');
  if (verb === 'GET' && params) {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const payment = store.pendingPayments.find((p) => p.id === Number(params.id));
    if (!payment?.proof_of_payment_url) {
      return json(404, { error: 'Not found' });
    }
    return binary(200, PLACEHOLDER_PROOF_SVG, 'image/svg+xml');
  }

  params = match(path, '/api/admin/payments/:id/confirm');
  if (verb === 'POST' && params) {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const payment = store.pendingPayments.find((p) => p.id === Number(params.id));
    if (!payment) {
      return json(404, { error: 'Not found' });
    }
    const result = confirmPayment(store, payment, body, {
      json,
      refreshPlan,
      todayIso,
      admin: gate.admin,
    });
    const plan = findPlan(store, payment.plan_id);
    const inst = plan?.installments.find((i) => i.id === payment.installment_id);
    store.ledger.push({ type: 'payment', plan_id: payment.plan_id, amount: inst?.amount });
    return result;
  }

  params = match(path, '/api/admin/payments/:id/reject');
  if (verb === 'POST' && params) {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const payment = store.pendingPayments.find((p) => p.id === Number(params.id));
    if (!payment) {
      return json(404, { error: 'Not found' });
    }
    return rejectPayment(store, payment, body, { json, admin: gate.admin });
  }

  if (verb === 'GET' && path === '/api/admin/dashboard') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const active = store.plans.filter(isOpen);
    active.forEach((p) => refreshPlan(store, p));
    return json(200, {
      active_layaways: active.length,
      collected_this_month: 184200,
      overdue_payments: active.filter((p) => p.list_status === 'warn').length,
      active_customers: new Set(active.map((p) => p.customer_id)).size,
      collections_last_6_weeks: [
        { week_start: '2026-08-30', total: 6200 },
        { week_start: '2026-09-06', total: 8000 },
        { week_start: '2026-09-13', total: 5500 },
        { week_start: '2026-09-20', total: 9000 },
        { week_start: '2026-09-27', total: 7400 },
        { week_start: '2026-10-04', total: 9600 },
      ],
      recent_activity: [
        { title: 'New reservation — Solitaire Halo Ring', detail: 'Sample Client · 2h ago' },
        { title: 'Payment received — LA-1003', detail: '₱10,833 · 5h ago' },
        { title: 'Payment overdue — LA-1002', detail: '2 days overdue' },
        { title: 'New customer registered', detail: 'Sample Patron · Yesterday' },
      ],
    });
  }

  if (verb === 'GET' && path === '/api/admin/customers') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const rows = store.customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      member_since: c.member_since,
      active_layaway_count: store.plans.filter((p) => p.customer_id === c.id && isOpen(p)).length,
    }));
    return json(200, rows);
  }

  params = match(path, '/api/admin/customers/:id/sessions');
  if (verb === 'DELETE' && params) {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    if (gate.admin.role !== 'admin') {
      return json(403, { error: 'Forbidden' });
    }
    const customer = customerById(store, params.id);
    if (!customer) {
      return json(404, { error: 'Not found' });
    }
    for (const [token, entry] of store.tokens) {
      if (entry.id === customer.id && (entry.kind === 'refresh' || entry.kind === 'customer')) {
        store.tokens.delete(token);
      }
    }
    return json(200, {});
  }

  params = match(path, '/api/admin/customers/:id');
  if (verb === 'GET' && params) {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const customer = customerById(store, params.id);
    if (!customer) {
      return json(404, { error: 'Not found' });
    }
    return json(200, {
      ...publicCustomer(customer),
      active_layaway_count: store.plans.filter((p) => p.customer_id === customer.id && isOpen(p))
        .length,
    });
  }

  params = match(path, '/api/admin/plans/:id/mark-next-paid');
  if (verb === 'POST' && params) {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const plan = findPlan(store, params.id);
    if (!plan) {
      return json(404, { error: 'Not found' });
    }
    const next = plan.installments.find((i) => i.status === 'pending' || i.status === 'overdue');
    if (next) {
      next.status = 'paid';
      next.paid_at = todayIso(store);
    }
    plan.force_on_track = true;
    refreshPlan(store, plan);
    return json(200, adminPlanView(store, plan));
  }

  if (path === '/api/admin/settings' && (verb === 'GET' || verb === 'PUT')) {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    if (verb === 'PUT') {
      store.settings = { ...store.settings, ...body };
    }
    return json(200, store.settings);
  }

  const epic = handleEpicRoutes({
    store,
    verb,
    path,
    params,
    body,
    headers,
    query,
    ip,
    helpers: {
      json,
      requireCustomer,
      requireAdmin,
      todayIso,
      findPlan,
      refreshPlan,
      orderView,
      adminPlanView,
      match,
      hitRate,
    },
  });
  if (epic) {
    return epic;
  }

  if (path.startsWith('/api/')) {
    return json(404, { error: 'Not found' });
  }

  return null;
}
