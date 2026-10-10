import { buildSchedule, markedUpTotal } from './finance.js';

function addDaysIso(value, days) {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + Number(days));
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function paymentFieldErrors(body, store) {
  const errors = [];
  if (!body?.bank_account_id) {
    errors.push('bank_account_id required');
  }
  if (!body?.reference_number?.trim()) {
    errors.push('reference_number required');
  }
  if (!body?.amount || Number(body.amount) <= 0) {
    errors.push('amount invalid');
  }
  const paidOn = body?.paid_on;
  if (!paidOn) {
    errors.push('paid_on required');
  } else if (paidOn > store.now().toISOString().slice(0, 10)) {
    errors.push('paid_on cannot be in the future');
  }
  if (errors.length) {
    return errors[0];
  }
  if (store.usedReferences.has(body.reference_number.trim())) {
    return 'reference number already used';
  }
  return null;
}

function pushCustomerNotification(store, customerId, item) {
  store.customerNotifications.unshift({
    id: store.nextNotificationId,
    read_at: null,
    created_at: store.now().toISOString(),
    ...item,
    customer_id: customerId,
  });
  store.nextNotificationId += 1;
}

function pushAdminNotification(store, item) {
  store.adminNotifications.unshift({
    id: store.nextNotificationId,
    read_at: null,
    created_at: store.now().toISOString(),
    ...item,
  });
  store.nextNotificationId += 1;
}

function pendingRow(store, payment) {
  const plan = store.plans.find((p) => p.id === payment.plan_id);
  const customer = store.customers.find((c) => c.id === plan?.customer_id);
  const expected = Number(payment.expected_amount);
  const submitted = Number(payment.amount_submitted);
  return {
    id: payment.id,
    kind: payment.kind,
    plan_id: payment.plan_id,
    customer_name: customer?.name,
    term_number: payment.term_number ?? null,
    due_date: payment.due_date ?? null,
    amount: String(expected),
    amount_submitted: String(submitted),
    amount_mismatch: expected !== submitted ? 1 : 0,
    reference_number: payment.reference_number,
    paid_on: payment.paid_on,
    proof_of_payment_url: payment.proof_of_payment_url ?? null,
    created_at: payment.created_at,
  };
}

export function handleEpicRoutes(ctx) {
  const { store, verb, path, body, headers, helpers } = ctx;
  const {
    json,
    requireCustomer,
    requireAdmin,
    todayIso,
    findPlan,
    refreshPlan,
    match,
  } = helpers;

  if (verb === 'POST' && path === '/api/customers/forgot-password') {
    if (helpers.hitRate(store, `${ctx.ip}:forgot`)) {
      return json(429, { error: 'too many attempts' });
    }
    const customer = store.customers.find(
      (row) => row.email?.toLowerCase() === String(body?.email || '').trim().toLowerCase(),
    );
    if (customer) {
      const token = `reset-${customer.id}-${store.nextTokenId}`;
      store.nextTokenId += 1;
      store.passwordResetTokens.set(token, { customer_id: customer.id, used: false });
    }
    return json(200, { ok: true });
  }

  if (verb === 'POST' && path === '/api/customers/reset-password') {
    const entry = store.passwordResetTokens.get(body?.token);
    if (!entry || entry.used) {
      return json(400, { error: 'Invalid or expired token' });
    }
    if (!body?.password || body.password.length < 8) {
      return json(400, { error: 'Password must be at least 8 characters' });
    }
    const customer = store.customers.find((c) => c.id === entry.customer_id);
    if (customer) {
      customer.password = body.password;
    }
    entry.used = true;
    store.tokens.forEach((value, key) => {
      if (value.kind === 'refresh' && value.id === entry.customer_id) {
        store.tokens.delete(key);
      }
    });
    return json(200, { ok: true });
  }

  if (verb === 'POST' && path === '/api/customers/change-password') {
    const gate = requireCustomer(store, headers);
    if (gate.error) {
      return gate.error;
    }
    if (gate.customer.password !== body?.current_password) {
      return json(401, { error: 'Current password is incorrect' });
    }
    if (!body?.new_password || body.new_password.length < 8) {
      return json(400, { error: 'Password must be at least 8 characters' });
    }
    if (body.new_password === body.current_password) {
      return json(400, { error: 'New password must differ from current password' });
    }
    gate.customer.password = body.new_password;
    return json(200, { ok: true });
  }

  if (verb === 'POST' && path === '/api/admin/change-password') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    if (store.admin.password !== body?.current_password) {
      return json(401, { error: 'Current password is incorrect' });
    }
    if (!body?.new_password || body.new_password.length < 8) {
      return json(400, { error: 'Password must be at least 8 characters' });
    }
    store.admin.password = body.new_password;
    return json(200, { ok: true });
  }

  if (verb === 'GET' && path === '/api/customers/notifications') {
    const gate = requireCustomer(store, headers);
    if (gate.error) {
      return gate.error;
    }
    let items = store.customerNotifications.filter((n) => n.customer_id === gate.customer.id);
    if (ctx.query.get('unread') === '1') {
      items = items.filter((n) => !n.read_at);
    }
    const limit = Number(ctx.query.get('limit') || 200);
    items = items.slice(0, limit);
    const unread = store.customerNotifications.filter(
      (n) => n.customer_id === gate.customer.id && !n.read_at,
    ).length;
    return json(200, { unread, items });
  }

  if (verb === 'POST' && path === '/api/customers/notifications/read') {
    const gate = requireCustomer(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const ids = body?.ids;
    const rows = store.customerNotifications.filter((n) => n.customer_id === gate.customer.id);
    if (Array.isArray(ids) && ids.length) {
      rows.forEach((row) => {
        if (ids.includes(row.id)) {
          row.read_at = store.now().toISOString();
        }
      });
    } else {
      rows.forEach((row) => {
        row.read_at = store.now().toISOString();
      });
    }
    return json(200, { ok: true });
  }

  if (verb === 'GET' && path === '/api/admin/notifications') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    let items = [...store.adminNotifications];
    if (ctx.query.get('unread') === '1') {
      items = items.filter((n) => !n.read_at);
    }
    const limit = Number(ctx.query.get('limit') || 200);
    items = items.slice(0, limit);
    const unread = store.adminNotifications.filter((n) => !n.read_at).length;
    return json(200, { unread, items });
  }

  if (verb === 'POST' && path === '/api/admin/notifications/read') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const ids = body?.ids;
    if (Array.isArray(ids) && ids.length) {
      store.adminNotifications.forEach((row) => {
        if (ids.includes(row.id)) {
          row.read_at = store.now().toISOString();
        }
      });
    } else {
      store.adminNotifications.forEach((row) => {
        row.read_at = store.now().toISOString();
      });
    }
    return json(200, { ok: true });
  }

  if (verb === 'GET' && path === '/api/admin/alerts') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const today = todayIso(store);
    store.plans.filter((p) => !p.completed).forEach((p) => refreshPlan(store, p));
    const pending_payments = store.pendingPayments.filter((p) => p.status === 'submitted').length;
    let due_today = 0;
    let overdue = 0;
    store.plans
      .filter((p) => !p.completed)
      .forEach((plan) => {
        plan.installments.forEach((inst) => {
          if (inst.status === 'paid' || inst.status === 'submitted') {
            return;
          }
          if (inst.due_date === today) {
            due_today += 1;
          } else if (inst.due_date < today) {
            overdue += 1;
          }
        });
      });
    const waiting_for_stock = store.plans.filter(
      (p) => p.reservation_status === 'waiting_for_stock',
    ).length;
    const reservation_problems = store.plans.filter((p) => p.reservation_error).length;
    const unread_notifications = store.adminNotifications.filter((n) => !n.read_at).length;
    return json(200, {
      pending_payments,
      due_today,
      overdue,
      waiting_for_stock,
      reservation_problems,
      unread_notifications,
    });
  }

  if (verb === 'GET' && path === '/api/admin/payments/due') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const today = todayIso(store);
    const items = [];
    store.plans
      .filter((p) => !p.completed)
      .forEach((plan) => {
        refreshPlan(store, plan);
        const customer = store.customers.find((c) => c.id === plan.customer_id);
        plan.installments.forEach((inst, index) => {
          if (inst.status === 'paid') {
            return;
          }
          const awaiting = inst.status === 'submitted' || inst.status === 'awaiting_confirmation';
          const dueToday = inst.due_date === today;
          const daysOverdue =
            inst.due_date < today
              ? Math.floor(
                  (Date.parse(today) - Date.parse(inst.due_date)) / (24 * 60 * 60 * 1000),
                )
              : 0;
          if (!dueToday && daysOverdue <= 0) {
            return;
          }
          const graceDays = plan.grace_period_days ?? store.settings.grace_period_days ?? 7;
          const graceEnd = addDaysIso(inst.due_date, Number(graceDays));
          items.push({
            installment_id: inst.id,
            plan_id: plan.id,
            term_number: inst.term_number ?? index + 1,
            due_date: inst.due_date,
            amount: inst.amount,
            days_overdue: daysOverdue,
            due_today: dueToday,
            awaiting_confirmation: awaiting,
            item_name: plan.item_name,
            grace_period_days: graceDays,
            grace_ends_on: graceEnd,
            customer_id: customer?.id,
            customer_name: customer?.name,
            customer_email: customer?.email,
            customer_phone: customer?.phone,
          });
        });
      });
    const dueTodayItems = items.filter((i) => i.due_today);
    const overdueItems = items.filter((i) => i.days_overdue > 0);
    return json(200, {
      as_of: today,
      due_today: {
        count: dueTodayItems.length,
        amount: dueTodayItems.reduce((sum, row) => sum + Number(row.amount), 0),
      },
      overdue: {
        count: overdueItems.length,
        amount: overdueItems.reduce((sum, row) => sum + Number(row.amount), 0),
      },
      items,
    });
  }

  let routeParams = match(path, '/api/layaway/plans/:id/down-payment/manual');
  if (verb === 'POST' && routeParams) {
    const gate = requireCustomer(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const plan = findPlan(store, routeParams.id);
    if (!plan || plan.customer_id !== gate.customer.id) {
      return json(404, { error: 'Not found' });
    }
    const fieldError = paymentFieldErrors(body, store);
    if (fieldError) {
      const status = fieldError.includes('reference') ? 409 : 400;
      return json(status, { error: fieldError });
    }
    if (plan.down_payment_status === 'paid') {
      return json(409, { error: 'Down payment already confirmed' });
    }
    if (plan.down_payment_status === 'submitted') {
      return json(409, { error: 'Down payment already awaiting confirmation' });
    }
    store.usedReferences.add(body.reference_number.trim());
    const payment = {
      id: store.nextPaymentId,
      kind: 'down_payment',
      plan_id: plan.id,
      status: 'submitted',
      expected_amount: plan.down_payment_amount,
      amount_submitted: body.amount,
      reference_number: body.reference_number.trim(),
      paid_on: body.paid_on,
      proof_of_payment_url: body.proof_of_payment ? '/placeholders/1.svg' : null,
      created_at: store.now().toISOString(),
    };
    store.nextPaymentId += 1;
    store.pendingPayments.push(payment);
    plan.down_payment_status = 'submitted';
    pushAdminNotification(store, {
      kind: 'payment_submitted',
      title: 'Down payment submitted',
      body: `${gate.customer.name} submitted a down payment for ${plan.id}.`,
      plan_id: plan.id,
      payment_id: payment.id,
    });
    return json(201, {
      id: payment.id,
      status: 'submitted',
      amount_matches_expected: Number(body.amount) === Number(plan.down_payment_amount),
      note: 'Awaiting admin confirmation',
    });
  }

  routeParams = match(path, '/api/admin/plans/:id/reservation/retry');
  if (verb === 'POST' && routeParams) {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    if (store.admin.role !== 'admin') {
      return json(403, { error: 'Forbidden' });
    }
    const plan = findPlan(store, routeParams.id);
    if (!plan) {
      return json(404, { error: 'Not found' });
    }
    if (plan.mock_retry_fail) {
      return json(409, { ok: false, error: 'Provider still unavailable' });
    }
    plan.reservation_error = null;
    plan.reservation_status = plan.in_stock === false ? 'waiting_for_stock' : 'reserved';
    return json(200, { ok: true, state: plan.reservation_status });
  }

  routeParams = match(path, '/api/admin/plans/:id/reservation/cancel');
  if (verb === 'POST' && routeParams) {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    if (store.admin.role !== 'admin') {
      return json(403, { error: 'Forbidden' });
    }
    if (!body?.reason?.trim()) {
      return json(400, { error: 'A reason is required.' });
    }
    if (!body?.handoff_confirmed) {
      return json(400, { error: 'Confirm the handoff with the customer.' });
    }
    const plan = findPlan(store, routeParams.id);
    if (!plan) {
      return json(404, { error: 'Not found' });
    }
    plan.reservation_status = 'cancelled';
    plan.reservation_error = null;
    return json(200, { ok: true, state: 'cancelled' });
  }

  routeParams = match(path, '/api/admin/payments/:id/confirmer-proof');
  if (verb === 'GET' && routeParams) {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    return json(404, { error: 'Not found' });
  }

  return null;
}

export function createPlanFromProduct(store, gate, body, helpers) {
  const { json, refreshPlan } = helpers;
  const product = store.catalog.find((p) => p.id === Number(body?.product_id));
  if (!product) {
    return json(404, { error: 'Product not found' });
  }
  if (!product.price || Number(product.price) <= 0) {
    return json(409, { error: 'This item has no peso price yet and cannot be put on lay-away' });
  }
  const termMonths = Number(body?.term_months) || store.settings.max_term_months || 3;
  if (termMonths > (store.settings.max_term_months || 3)) {
    return json(400, { error: 'term_months exceeds max' });
  }
  const totalPrice = markedUpTotal(product.price);
  const { down_payment_amount, financed_principal, schedule } = buildSchedule({
    totalPrice,
    termMonths,
    startDate: store.now(),
  });
  const id = `LA-${store.nextPlanSeq}`;
  store.nextPlanSeq += 1;
  const installments = schedule.map((row, index) => ({
    id: `${id}-i${index + 1}`,
    term_number: row.term_number,
    due_date: row.due_date,
    amount: String(row.amount),
    principal_amount: row.principal_amount,
    interest_amount: row.interest_amount,
    status: 'pending',
    paid_at: null,
    rejection_reason: null,
  }));
  const plan = {
    id,
    customer_id: gate.customer.id,
    product_id: product.id,
    item_name: product.name,
    plan_label: `${termMonths} Mo. / ${installments.length} Payments`,
    next_due: installments[0]?.due_date ?? null,
    list_status: 'ok',
    term_months: termMonths,
    total_price: totalPrice,
    down_payment_amount,
    down_payment_status: 'pending',
    down_payment_rejection_reason: null,
    financed_principal,
    currency: 'PHP',
    note: 'Markup applied (mock).',
    completed: false,
    completed_on: null,
    reservation_status: 'none',
    reservation_error: null,
    down_payment_confirmed_at: null,
    grace_period_days: store.settings.grace_period_days ?? null,
    installments,
    created_at: store.now().toISOString(),
  };
  store.plans.push(plan);
  refreshPlan(store, plan);
  pushCustomerNotification(store, gate.customer.id, {
    kind: 'plan_created',
    title: 'Lay-away plan created',
    body: `Plan ${id} for ${product.name}.`,
    plan_id: id,
    payment_id: null,
  });
  return json(201, {
    id: plan.id,
    total_price: plan.total_price,
    down_payment_amount: plan.down_payment_amount,
    financed_principal: plan.financed_principal,
    currency: plan.currency,
    term_months: plan.term_months,
    installments: installments.length,
    schedule,
    note: plan.note,
  });
}

export function confirmPayment(store, payment, body, helpers) {
  const { json, refreshPlan, todayIso } = helpers;
  if (store.admin.role !== 'admin' && store.admin.role !== 'receivables') {
    return json(403, { error: 'Forbidden' });
  }
  payment.status = 'confirmed';
  payment.confirmer_note = body?.note ?? null;
  const plan = store.plans.find((p) => p.id === payment.plan_id);
  if (!plan) {
    return json(200, { status: 'confirmed' });
  }
  if (payment.kind === 'down_payment') {
    plan.down_payment_status = 'paid';
    plan.down_payment_confirmed_at = todayIso(store);
    plan.reservation_status = plan.in_stock === false ? 'waiting_for_stock' : 'reserved';
    pushCustomerNotification(store, plan.customer_id, {
      kind: 'down_payment_confirmed',
      title: 'Down payment confirmed',
      body: 'Your down payment is confirmed.',
      plan_id: plan.id,
      payment_id: payment.id,
    });
    return json(200, {
      status: 'confirmed',
      reservation: {
        ok: true,
        action: 'hold',
        state: plan.reservation_status,
      },
    });
  }
  const inst = plan.installments.find((i) => i.id === payment.installment_id);
  if (inst) {
    inst.status = 'paid';
    inst.paid_at = todayIso(store);
  }
  refreshPlan(store, plan);
  if (plan.installments.every((i) => i.status === 'paid') && plan.down_payment_status === 'paid') {
    plan.completed = true;
    plan.completed_on = todayIso(store);
    plan.reservation_status = 'completed';
    return json(200, {
      status: 'confirmed',
      reservation: { ok: true, action: 'complete', state: 'completed' },
    });
  }
  pushCustomerNotification(store, plan.customer_id, {
    kind: 'payment_confirmed',
    title: 'Payment confirmed',
    body: 'Your installment payment is confirmed.',
    plan_id: plan.id,
    payment_id: payment.id,
  });
  return json(200, { status: 'confirmed', reservation: { ok: true, action: 'installment' } });
}

export function rejectPayment(store, payment, body, helpers) {
  const { json } = helpers;
  if (store.admin.role !== 'admin' && store.admin.role !== 'receivables') {
    return json(403, { error: 'Forbidden' });
  }
  if (!body?.reason?.trim()) {
    return json(400, { error: 'A reason is required.' });
  }
  payment.status = 'rejected';
  payment.reason = body.reason.trim();
  const plan = store.plans.find((p) => p.id === payment.plan_id);
  if (plan && payment.kind === 'down_payment') {
    plan.down_payment_status = 'rejected';
    plan.down_payment_rejection_reason = payment.reason;
    store.usedReferences.delete(payment.reference_number);
  }
  if (plan && payment.kind === 'installment') {
    const inst = plan.installments.find((i) => i.id === payment.installment_id);
    if (inst) {
      inst.status = 'rejected';
      inst.rejection_reason = payment.reason;
    }
    store.usedReferences.delete(payment.reference_number);
  }
  pushCustomerNotification(store, plan?.customer_id, {
    kind: 'payment_rejected',
    title: 'Payment rejected',
    body: payment.reason,
    plan_id: plan?.id,
    payment_id: payment.id,
  });
  return json(200, { status: 'rejected', reason: payment.reason });
}

export { pendingRow, paymentFieldErrors, pushAdminNotification, pushCustomerNotification };
