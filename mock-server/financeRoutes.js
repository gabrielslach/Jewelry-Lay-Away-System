const round2 = (value) => Math.round(value * 100) / 100;
const INTEREST_RATE = 0.05;

function csv(filename, columns, rows) {
  const lines = [columns.join(',')];
  rows.forEach((row) =>
    lines.push(columns.map((key) => JSON.stringify(row[key] ?? '')).join(',')),
  );
  return {
    status: 200,
    body: lines.join('\n'),
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
    binary: true,
  };
}

const numericId = (id) => Number(String(id).replace(/\D/g, ''));

// The API sends ISO UTC timestamps; plain dates are Manila calendar days.
const toTimestamp = (value) =>
  value.length === 10
    ? new Date(`${value}T00:00:00+08:00`).toISOString()
    : value;

function installmentRows(store, { refreshPlan, customerById }) {
  let nextInstallmentId = 1;
  return store.plans.flatMap((plan) => {
    refreshPlan(store, plan);
    const customer = customerById(store, plan.customer_id);
    return plan.installments.map((installment) => ({
      plan,
      installment,
      installment_id: nextInstallmentId++,
      customer,
    }));
  });
}

function receivables(store, helpers) {
  const today = store.now().toISOString().slice(0, 10);
  const open = installmentRows(store, helpers).filter(
    ({ plan, installment }) =>
      !plan.closed_status &&
      installment.status !== 'paid' &&
      installment.status !== 'superseded',
  );
  const items = open
    .filter(({ installment }) => installment.status === 'overdue')
    .map(({ plan, installment, installment_id: id, customer }) => ({
      installment_id: id,
      plan_id: numericId(plan.id),
      term_number: installment.term_number,
      due_date: toTimestamp(installment.due_date),
      amount: Number(installment.amount),
      days_overdue: Math.max(
        1,
        Math.round(
          (Date.parse(today) - Date.parse(installment.due_date)) / 86_400_000,
        ),
      ),
      customer_id: customer?.id ?? null,
      customer_name: customer?.name ?? '',
      customer_email: customer?.email ?? '',
      customer_phone: customer?.phone ?? '',
    }));
  const bucket = (label, test) => {
    const hit = items.filter((item) => test(item.days_overdue));
    return {
      label,
      count: hit.length,
      amount: round2(hit.reduce((sum, item) => sum + item.amount, 0)),
    };
  };
  return {
    overdue: bucket('Overdue', () => true),
    outstanding_receivable: {
      count: open.length,
      amount: round2(
        open.reduce(
          (sum, { installment }) => sum + Number(installment.amount),
          0,
        ),
      ),
    },
    aging: [
      bucket('1-7 days', (days) => days <= 7),
      bucket('8-30 days', (days) => days > 7 && days <= 30),
      bucket('31+ days', (days) => days > 30),
    ],
    items,
  };
}

function ledger(store, query, helpers) {
  const planFilter = query.get('plan_id');
  return installmentRows(store, helpers)
    .filter(({ installment }) => installment.status !== 'superseded')
    .map(({ plan, installment, installment_id: id, customer }) => {
      const paid = installment.status === 'paid';
      return {
        id,
        created_at: toTimestamp(paid ? installment.paid_at : installment.due_date),
        entry_type: paid ? 'payment' : 'receivable',
        amount: Number(installment.amount).toFixed(2),
        plan_id: numericId(plan.id),
        installment_id: id,
        finance_account_id: paid ? 1 : null,
        customer_name: customer?.name ?? '',
      };
    })
    .filter((entry) => !query.get('from') || entry.created_at >= query.get('from'))
    .filter((entry) => !query.get('to') || entry.created_at <= query.get('to'))
    .filter(
      (entry) =>
        !query.get('entry_type') ||
        entry.entry_type === query.get('entry_type'),
    )
    .filter((entry) => !planFilter || entry.plan_id === Number(planFilter))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function profit(store, query, helpers) {
  const from = query.get('from');
  const to = query.get('to');
  const months = new Map();
  let realizedInterest = 0;
  let scheduledInterest = 0;
  let installmentsPaid = 0;
  installmentRows(store, helpers).forEach(({ installment }) => {
    const interest =
      Number(installment.amount) * (INTEREST_RATE / (1 + INTEREST_RATE));
    if (installment.status !== 'paid') {
      scheduledInterest += interest;
      return;
    }
    const day = installment.paid_at;
    if ((from && day < from) || (to && day > to)) {
      return;
    }
    realizedInterest += interest;
    installmentsPaid += 1;
    const key = day.slice(0, 7);
    const row = months.get(key) ?? {
      month: key,
      interest_profit: 0,
      markup_profit: 0,
    };
    row.interest_profit = round2(row.interest_profit + interest);
    months.set(key, row);
  });
  const booked = store.plans.reduce(
    (sum, plan) => sum + Number(plan.total_price) * 0.3,
    0,
  );
  const by_month = [...months.values()].sort((a, b) =>
    a.month.localeCompare(b.month),
  );
  return {
    interest_profit: {
      realized: round2(realizedInterest),
      scheduled_remaining: round2(scheduledInterest),
      installments_paid: installmentsPaid,
    },
    markup_profit: {
      booked_on_new_plans: round2(booked),
      realized_on_installments: 0,
      plans_counted: store.plans.length,
    },
    total_realized: round2(realizedInterest),
    principal_collected: 0,
    down_payments_collected: 0,
    by_month,
  };
}

function pageOf(rows, query) {
  const limit = Number(query.get('limit')) || rows.length;
  const offset = Number(query.get('offset')) || 0;
  return rows.slice(offset, offset + limit);
}

export function handleFinanceRoutes(
  store,
  { verb, path, query, headers },
  helpers,
) {
  const { json, requireAdmin } = helpers;
  if (verb !== 'GET') {
    return null;
  }
  const isCsv = query.get('format') === 'csv';

  if (path === '/api/finance/ledger') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const rows = ledger(store, query, helpers);
    if (isCsv) {
      return csv(
        'ledger.csv',
        [
          'id',
          'created_at',
          'entry_type',
          'amount',
          'plan_id',
          'installment_id',
          'finance_account_id',
          'customer_name',
        ],
        rows,
      );
    }
    return json(200, pageOf(rows, query));
  }

  if (path === '/api/admin/reports/receivables') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const report = receivables(store, helpers);
    if (isCsv) {
      return csv(
        'receivables-overdue.csv',
        [
          'installment_id',
          'plan_id',
          'term_number',
          'due_date',
          'amount',
          'days_overdue',
          'customer_id',
          'customer_name',
          'customer_email',
          'customer_phone',
        ],
        report.items,
      );
    }
    return json(200, report);
  }

  if (path === '/api/admin/reports/profit') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const report = profit(store, query, helpers);
    if (isCsv) {
      return csv(
        'profit-by-month.csv',
        ['month', 'interest_profit', 'markup_profit', 'total'],
        report.by_month.map((row) => ({
          ...row,
          total: round2(row.interest_profit + row.markup_profit),
        })),
      );
    }
    return json(200, report);
  }
  return null;
}

function bankAccountFields(body, { requireAll }) {
  const fields = {};
  [
    ['bank_name', 100],
    ['account_name', 100],
    ['account_number', 50],
  ].forEach(([key, max]) => {
    const value = body?.[key] ?? (requireAll ? '' : undefined);
    if (value === undefined) {
      return;
    }
    if (!String(value).trim()) {
      fields[key] = 'This field is required.';
    } else if (String(value).length > max) {
      fields[key] = `Must be ${max} characters or fewer.`;
    }
  });
  return fields;
}

function applyBankAccount(account, body) {
  ['bank_name', 'account_name', 'account_number'].forEach((key) => {
    if (body?.[key] !== undefined) {
      account[key] = String(body[key]).trim();
    }
  });
  if (body?.is_active !== undefined) {
    account.is_active = body.is_active === true || body.is_active === 'true';
  }
  if (body?.remove_qr_code === 'true' || body?.remove_qr_code === true) {
    account.qr_code_url = null;
  }
  if (body?.qr_code) {
    account.qr_code_url = '/placeholders/1.svg';
  }
}

export function handleBankAccountRoutes(
  store,
  { verb, path, body, headers },
  helpers,
) {
  const { json, requireAdmin, match } = helpers;
  const params = match(path, '/api/admin/bank-accounts/:id');
  if (path !== '/api/admin/bank-accounts' && !params) {
    return null;
  }
  const gate = requireAdmin(store, headers);
  if (gate.error) {
    return gate.error;
  }
  if (verb === 'GET' && !params) {
    return json(200, store.bankAccounts);
  }
  if (gate.admin.role !== 'admin') {
    return json(403, { error: 'Forbidden' });
  }
  const duplicate = (candidate, exceptId) =>
    store.bankAccounts.some(
      (a) =>
        a.id !== exceptId &&
        a.bank_name === candidate.bank_name &&
        a.account_number === candidate.account_number,
    );

  if (verb === 'POST' && !params) {
    const fields = bankAccountFields(body, { requireAll: true });
    if (Object.keys(fields).length > 0) {
      return json(400, { error: 'Invalid bank account', fields });
    }
    const account = {
      id: store.nextBankAccountId,
      qr_code_url: null,
      is_active: true,
    };
    store.nextBankAccountId += 1;
    applyBankAccount(account, body);
    account.created_at = store.now().toISOString();
    if (duplicate(account)) {
      return json(409, { error: 'This bank account already exists' });
    }
    store.bankAccounts.push(account);
    return json(201, account);
  }

  if (verb === 'PATCH' && params) {
    const account = store.bankAccounts.find((a) => a.id === Number(params.id));
    if (!account) {
      return json(404, { error: 'Not found' });
    }
    const fields = bankAccountFields(body, { requireAll: false });
    if (Object.keys(fields).length > 0) {
      return json(400, { error: 'Invalid bank account', fields });
    }
    const next = { ...account };
    applyBankAccount(next, body);
    if (duplicate(next, account.id)) {
      return json(409, { error: 'This bank account already exists' });
    }
    const othersActive = store.bankAccounts.some(
      (a) => a.id !== account.id && a.is_active,
    );
    if (account.is_active && !next.is_active && !othersActive) {
      return json(409, { error: 'At least one bank account must stay active' });
    }
    Object.assign(account, next);
    return json(200, account);
  }
  return json(405, { error: 'Method not allowed' });
}
