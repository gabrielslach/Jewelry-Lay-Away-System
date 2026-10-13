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

function installmentRows(store, { refreshPlan, customerById }) {
  return store.plans.flatMap((plan) => {
    refreshPlan(store, plan);
    const customer = customerById(store, plan.customer_id);
    return plan.installments.map((installment) => ({
      plan,
      installment,
      customer_name: customer?.name ?? '',
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
    .map(({ plan, installment, customer_name: name }) => ({
      plan_id: plan.id,
      customer_name: name,
      item_name: plan.item_name,
      due_date: installment.due_date,
      amount: Number(installment.amount),
      days_overdue: Math.max(
        1,
        Math.round(
          (Date.parse(today) - Date.parse(installment.due_date)) / 86_400_000,
        ),
      ),
    }));
  const bucket = (test) => {
    const hit = items.filter((item) => test(item.days_overdue));
    return {
      count: hit.length,
      amount: round2(hit.reduce((sum, item) => sum + item.amount, 0)),
    };
  };
  return {
    overdue: bucket(() => true),
    outstanding_receivable: {
      count: open.length,
      amount: round2(
        open.reduce(
          (sum, { installment }) => sum + Number(installment.amount),
          0,
        ),
      ),
    },
    aging: {
      days_1_7: bucket((days) => days <= 7),
      days_8_30: bucket((days) => days > 7 && days <= 30),
      days_31_plus: bucket((days) => days > 30),
    },
    items,
  };
}

function ledger(store, query, helpers) {
  const planFilter = query.get('plan_id');
  const entries = installmentRows(store, helpers)
    .filter(({ installment }) => installment.status !== 'superseded')
    .map(({ plan, installment, customer_name: name }) => {
      const paid = installment.status === 'paid';
      return {
        date: paid ? installment.paid_at : installment.due_date,
        entry_type: paid ? 'payment' : 'receivable',
        plan_id: plan.id,
        customer_name: name,
        description:
          `${plan.item_name}, installment ${installment.term_number ?? ''}`.trim(),
        amount: Number(installment.amount),
      };
    })
    .filter((entry) => !query.get('from') || entry.date >= query.get('from'))
    .filter((entry) => !query.get('to') || entry.date <= query.get('to'))
    .filter(
      (entry) =>
        !query.get('entry_type') ||
        entry.entry_type === query.get('entry_type'),
    )
    .filter((entry) => {
      if (!planFilter) {
        return true;
      }
      const plan = helpers.findPlan(store, planFilter);
      return plan ? plan.id === entry.plan_id : false;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  return entries;
}

function profit(store, query, helpers) {
  const from = query.get('from');
  const to = query.get('to');
  const months = new Map();
  let realizedInterest = 0;
  let scheduledInterest = 0;
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
    const key = day.slice(0, 7);
    const row = months.get(key) ?? {
      month: key,
      interest_profit: 0,
      markup_profit: 0,
      total: 0,
    };
    row.interest_profit = round2(row.interest_profit + interest);
    row.total = round2(row.interest_profit + row.markup_profit);
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
    },
    markup_profit: {
      booked_on_new_plans: round2(booked),
      realized_on_installments: 0,
    },
    total_realized: round2(realizedInterest),
    principal_collected: 0,
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
          'date',
          'entry_type',
          'plan_id',
          'customer_name',
          'description',
          'amount',
        ],
        rows,
      );
    }
    return json(200, { results: pageOf(rows, query), count: rows.length });
  }

  if (path === '/api/admin/reports/receivables') {
    const gate = requireAdmin(store, headers);
    if (gate.error) {
      return gate.error;
    }
    const report = receivables(store, helpers);
    if (isCsv) {
      return csv(
        'receivables.csv',
        [
          'plan_id',
          'customer_name',
          'item_name',
          'due_date',
          'amount',
          'days_overdue',
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
        report.by_month,
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
