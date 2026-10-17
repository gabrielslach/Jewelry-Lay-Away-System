import { CAP_HINT, ROLE_LABELS, STAFF_ROLES } from '../lib/staffRoles.js';

export default function StaffRoleSelect({ value, onChange, disabled, full, keepRole, lockedHint }) {
  const isLimited = (role) => full.includes(role) && role !== keepRole;
  const hint = lockedHint ?? (STAFF_ROLES.some(isLimited) ? CAP_HINT : null);

  return (
    <div className="form-row">
      <label htmlFor="staff-role">Role</label>
      <select
        id="staff-role"
        value={value}
        required
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {STAFF_ROLES.map((role) => (
          <option key={role} value={role} disabled={isLimited(role)}>
            {isLimited(role) ? `${ROLE_LABELS[role]} (limit reached)` : ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
