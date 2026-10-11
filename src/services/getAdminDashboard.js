import { adminRequest } from './ensureAdminToken.js';

function formatActivityTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function unwrap(value, key) {
  return value !== null && typeof value === 'object' ? value[key] : value;
}

function normalizeCollections(weeks) {
  if (!Array.isArray(weeks)) {
    return [];
  }
  const totals = weeks.map((week) => Number(week.total) || 0);
  const max = Math.max(...totals, 0);
  return weeks.map((week, index) => ({
    week_start: week.week_start,
    total: totals[index],
    height: max === 0 ? 0 : Math.round((totals[index] / max) * 100),
  }));
}

function normalizeActivity(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item, index) => {
    const title = item.label ?? item.title ?? '';
    const baseDetail = item.detail ?? '';
    const detail =
      item.timestamp != null && item.timestamp !== ''
        ? `${baseDetail} · ${formatActivityTimestamp(item.timestamp)}`
        : baseDetail;
    const key = [title, baseDetail, item.timestamp ?? '', String(index)].join('|');
    return { title, detail, key };
  });
}

export async function getAdminDashboard() {
  const data = await adminRequest('/api/admin/dashboard');
  return {
    ...data,
    active_layaways: unwrap(data.active_layaways, 'count'),
    collected_this_month: unwrap(data.collected_this_month, 'total'),
    overdue_payments: unwrap(data.overdue_payments, 'count'),
    active_customers: unwrap(data.active_customers, 'count'),
    collections_last_6_weeks: normalizeCollections(data.collections_last_6_weeks),
    recent_activity: normalizeActivity(data.recent_activity),
  };
}
