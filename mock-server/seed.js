import galleryPage from './gallery-items.json';

const DISPLAY = [
  {
    name: 'Solitaire Halo Ring',
    category: 'Rings',
    material: '18K White Gold',
    stone: '0.75ct Diamond',
    size: 'US 6 (resizable)',
    cert: 'GIA Certified',
  },
  {
    name: 'Vintage Rose Pendant',
    category: 'Necklaces',
    material: '14K Rose Gold',
    stone: '0.40ct Diamond Cluster',
    size: '18in Chain',
    cert: 'In-house Appraisal',
  },
  {
    name: 'Emerald Drop Earrings',
    category: 'Earrings',
    material: '18K Yellow Gold',
    stone: 'Emerald & Diamond',
    size: 'Standard Post',
    cert: 'GIA Certified',
  },
  {
    name: 'Classic Tennis Bracelet',
    category: 'Bracelets',
    material: '14K White Gold',
    stone: '2.10ct Diamond (Total)',
    size: '7in, Adjustable',
    cert: 'GIA Certified',
  },
  {
    name: 'Sapphire Signet Ring',
    category: 'Rings',
    material: '18K Yellow Gold',
    stone: '1.2ct Sapphire',
    size: 'US 7 (resizable)',
    cert: 'In-house Appraisal',
  },
  {
    name: 'Pearl Drop Necklace',
    category: 'Necklaces',
    material: 'Sterling Silver',
    stone: 'Akoya Pearl',
    size: '16in Chain',
    cert: 'In-house Appraisal',
  },
];

export function buildCatalog() {
  return galleryPage.results.map((item, index) => {
    const display = DISPLAY[index % DISPLAY.length];
    return {
      ...item,
      ...display,
      name:
        index < DISPLAY.length ? display.name : `${display.name} ${item.title}`,
    };
  });
}

export function initialCustomers() {
  return [
    {
      id: 1,
      name: 'Sample Client',
      email: 'client@sampleemail.com',
      password: 'password',
      phone: '+63 900 000 0001',
      member_since: 'Jan 2026',
    },
    {
      id: 2,
      name: 'Sample Buyer',
      email: 'buyer@sampleemail.com',
      password: 'password',
      phone: '+63 900 000 0002',
      member_since: 'Mar 2026',
    },
    {
      id: 3,
      name: 'Sample User',
      email: 'user@sampleemail.com',
      password: 'password',
      phone: '+63 900 000 0003',
      member_since: 'Aug 2025',
    },
    {
      id: 4,
      name: 'Sample Patron',
      email: 'patron@sampleemail.com',
      password: 'password',
      phone: '+63 900 000 0004',
      member_since: 'Jun 2026',
    },
    {
      id: 5,
      name: 'Sample Shopper',
      email: 'shopper@sampleemail.com',
      password: 'password',
      phone: '+63 900 000 0005',
      member_since: 'Apr 2026',
    },
  ];
}

export function initialAdmin() {
  return {
    id: 1,
    name: 'Sample Admin',
    email: 'admin@samplejewelry.example',
    password: 'password',
  };
}

export function planLabel(termMonths, paymentCount) {
  return `${termMonths} Mo. / ${paymentCount} Payments`;
}

function productByName(catalog, name) {
  return catalog.find((piece) => piece.name === name) ?? catalog[0];
}

export function initialPlans(catalog) {
  const specs = [
    {
      id: 'LA-1001',
      customer_id: 1,
      item: 'Solitaire Halo Ring',
      term_months: 3,
      payments: 6,
      due: '2026-10-25',
      status: 'ok',
    },
    {
      id: 'LA-1002',
      customer_id: 2,
      item: 'Emerald Drop Earrings',
      term_months: 2,
      payments: 4,
      due: '2026-09-15',
      status: 'warn',
    },
    {
      id: 'LA-1003',
      customer_id: 3,
      item: 'Classic Tennis Bracelet',
      term_months: 3,
      payments: 6,
      due: '2026-10-05',
      status: 'ok',
    },
    {
      id: 'LA-1004',
      customer_id: 4,
      item: 'Sapphire Signet Ring',
      term_months: 1,
      payments: 2,
      due: '2026-09-12',
      status: 'warn',
    },
    {
      id: 'LA-1005',
      customer_id: 5,
      item: 'Pearl Drop Necklace',
      term_months: 2,
      payments: 4,
      due: '2026-09-30',
      status: 'ok',
    },
  ];

  return specs.map((spec) => {
    const product = productByName(catalog, spec.item);
    const paidCount =
      spec.status === 'ok' ? Math.ceil(spec.payments / 2) : Math.floor(spec.payments / 3);
    const amount = Math.round(Number(product.price) / spec.payments);
    const installments = Array.from({ length: spec.payments }, (_, index) => {
      const paid = index < paidCount;
      return {
        id: `${spec.id}-i${index + 1}`,
        due_date: index === paidCount ? spec.due : `2026-1${Math.min(2, index)}-15`,
        amount: String(amount),
        status: paid ? 'paid' : 'pending',
        paid_at: paid ? '2026-08-01' : null,
      };
    });
    return {
      id: spec.id,
      customer_id: spec.customer_id,
      product_id: product.id,
      item_name: spec.item,
      plan_label: planLabel(spec.term_months, spec.payments),
      next_due: spec.due,
      list_status: spec.status,
      term_months: spec.term_months,
      total_price: product.price,
      currency: 'PHP',
      note: 'Markup not applied (mock).',
      completed: false,
      completed_on: null,
      installments,
    };
  });
}

export function initialCompletedPlan(catalog) {
  const product = productByName(catalog, 'Vintage Rose Pendant');
  return {
    id: 'LA-0987',
    customer_id: 1,
    product_id: product.id,
    item_name: 'Vintage Rose Pendant',
    plan_label: planLabel(2, 4),
    next_due: null,
    list_status: 'ok',
    term_months: 2,
    total_price: product.price,
    currency: 'PHP',
    note: null,
    completed: true,
    completed_on: 'Jul 2026',
    installments: Array.from({ length: 4 }, (_, index) => ({
      id: `LA-0987-i${index + 1}`,
      due_date: '2026-06-01',
      amount: String(Math.round(Number(product.price) / 4)),
      status: 'paid',
      paid_at: '2026-06-01',
    })),
  };
}

export function initialBankAccounts() {
  return [
    {
      id: 1,
      bank_name: 'Sample Bank',
      account_name: 'AlMar Corp',
      account_number: '0011-2233-4455',
      qr_code_url: '/placeholders/1.svg',
    },
  ];
}

export function initialSettings() {
  return {
    business_name: 'Sample Jewelry Co.',
    max_term_months: 3,
    late_penalty_per_day: 50,
    require_full_payment_before_release: true,
    sms_reminders: true,
    customer_selected_due_dates: true,
  };
}
