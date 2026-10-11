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
  if (!plan.completed) {
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
  if (!auth || auth.kind !== 'admin') {
    return { error: json(401, { error: 'Unauthorized' }) };
  }
  return { admin: store.admin };
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
    category: piece.category,
    material: piece.material,
    stone: piece.stone,
    size: piece.size,
    cert: piece.cert,
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
  return plan.list_status === 'warn' ? 'overdue' : 'on_track';
}

function orderView(store, plan) {
  refreshPlan(store, plan);
  return {
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
    plan_status: plan.completed ? 'completed' : 'active',
    completed_on: plan.completed ? asIso(plan.completed_on) : null,
    created_at: asIso(plan.created_at) ?? '2026-01-15T00:00:00.000Z',
    installments: plan.installments.map((row, index) => ({
      id: row.id,
      term_number: row.term_number ?? index + 1,
      due_date: asIso(row.due_date),
      amount: row.amount,
      status: row.status,
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
    status: plan.completed ? 'completed' : plan.list_status,
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
    const plan = findPlan(store, params.id);
    if (!plan) {
      return json(404, { error: 'Not found' });
    }
    refreshPlan(store, plan);
    return json(200, {
      id: plan.id,
      total_price: plan.total_price,
      currency: plan.currency,
      term_months: plan.term_months,
      installments: plan.installments,
      status: plan.completed ? 'completed' : plan.list_status,
      note: plan.note,
    });
  }

  if (verb === 'GET' && path === '/api/bank-accounts') {
    return json(200, { results: store.bankAccounts });
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
    if (body?.email !== store.admin.email || body?.password !== store.admin.password) {
      return json(401, { error: 'Invalid credentials' });
    }
    return json(200, issueAdminSession(store, store.admin));
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

  if (verb === 'GET' && path === '/api/finance/ledger') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    return json(200, { results: store.ledger });
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

  if (verb === 'POST' && path === '/api/bank-accounts') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const account = {
      id: store.bankAccounts.length + 1,
      bank_name: body?.bank_name,
      account_name: body?.account_name,
      account_number: body?.account_number,
      qr_code_url: '/placeholders/1.svg',
    };
    store.bankAccounts.push(account);
    return json(201, account);
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
    return json(200, { url: '/placeholders/1.svg' });
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
    return rejectPayment(store, payment, body, { json });
  }

  if (verb === 'GET' && path === '/api/admin/dashboard') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const active = store.plans.filter((p) => !p.completed);
    active.forEach((p) => refreshPlan(store, p));
    return json(200, {
      active_layaways: active.length,
      collected_this_month: 184200,
      overdue_payments: active.filter((p) => p.list_status === 'warn').length,
      active_customers: new Set(active.map((p) => p.customer_id)).size,
      collections_last_6_weeks: [62, 80, 55, 90, 74, 96],
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
      active_layaways: store.plans.filter((p) => p.customer_id === c.id && !p.completed).length,
    }));
    return json(200, { results: rows });
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
      active_layaways: store.plans.filter((p) => p.customer_id === customer.id && !p.completed)
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
