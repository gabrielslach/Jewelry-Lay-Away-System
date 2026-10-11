import { adminRequest } from './ensureAdminToken.js';

function formatActivityTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function normalizeCollections(weeks) {
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return [];
  }
  if (typeof weeks[0] === 'number') {
    return weeks;
  }
  const totals = weeks.map((week) => Number(week?.total) || 0);
  const max = Math.max(...totals, 0);
  if (max === 0) {
    return totals.map(() => 0);
  }
  return totals.map((total) => Math.round((total / max) * 100));
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
    collections_last_6_weeks: normalizeCollections(data.collections_last_6_weeks),
    recent_activity: normalizeActivity(data.recent_activity),
  };
}
