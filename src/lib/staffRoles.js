export const STAFF_ROLES = ['admin', 'accounting'];
export const ROLE_LABELS = { admin: 'Admin', accounting: 'Accounting' };
export const ROLE_CAPS = { admin: 2, accounting: 3 };
export const CAP_HINT =
  'Admins are limited to 2 and accounting to 3 active accounts. Deactivate someone to free a seat.';
export const MIN_PASSWORD_LENGTH = 8;

export function activeCounts(staff) {
  const counts = { admin: 0, accounting: 0 };
  staff.forEach((member) => {
    if (member.is_active) {
      counts[member.role] += 1;
    }
  });
  return counts;
}

export function fullRoles(counts) {
  return STAFF_ROLES.filter((role) => counts[role] >= ROLE_CAPS[role]);
}
