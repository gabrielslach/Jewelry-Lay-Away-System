import { publicStaff } from './store.js';

const ROLE_CAPS = { admin: 2, accounting: 3 };

function activeCount(store, role, exceptId) {
  return store.staff.filter((m) => m.is_active && m.role === role && m.id !== exceptId).length;
}

function capError(store, role, exceptId) {
  return activeCount(store, role, exceptId) >= ROLE_CAPS[role]
    ? `At most ${ROLE_CAPS[role]} active ${role} accounts are allowed`
    : null;
}

function createStaff(store, { body, admin }, { json }) {
  const name = body?.name?.trim();
  const email = body?.email?.trim();
  if (!name || !email || !(body?.password?.length >= 8) || !ROLE_CAPS[body?.role]) {
    return json(400, { error: 'name, email, password (8+ chars) and a valid role are required' });
  }
  if (store.staff.some((m) => m.email === email)) {
    return json(409, { error: 'An account with that email already exists' });
  }
  const error = capError(store, body.role);
  if (error) {
    return json(409, { error });
  }
  const member = {
    id: store.nextStaffId,
    name,
    email,
    password: body.password,
    role: body.role,
    is_active: true,
    created_by: admin.id,
    created_at: store.now().toISOString(),
  };
  store.nextStaffId += 1;
  store.staff.push(member);
  return json(201, publicStaff(member));
}

function updateStaff(store, { id, body, admin }, { json }) {
  const member = store.staff.find((m) => m.id === Number(id));
  if (!member) {
    return json(404, { error: 'Not found' });
  }
  const role = body?.role ?? member.role;
  const isActive = body?.is_active ?? member.is_active;
  if (!ROLE_CAPS[role]) {
    return json(400, { error: 'Invalid role' });
  }
  if (member.id === admin.id && (role !== member.role || !isActive)) {
    return json(403, { error: 'You cannot change your own role or deactivate your own account' });
  }
  const demotesAdmin = member.role === 'admin' && member.is_active && (role !== 'admin' || !isActive);
  if (demotesAdmin && activeCount(store, 'admin', member.id) === 0) {
    return json(409, { error: 'Cannot demote or deactivate the last active admin' });
  }
  const error = isActive && capError(store, role, member.id);
  if (error) {
    return json(409, { error });
  }
  if (body?.password && body.password.length < 8) {
    return json(400, { error: 'Password must be at least 8 characters' });
  }
  member.name = body?.name?.trim() || member.name;
  member.password = body?.password || member.password;
  member.role = role;
  member.is_active = isActive;
  return json(200, publicStaff(member));
}

export function handleStaffRoutes(store, { verb, path, body, admin }, { json, match }) {
  if (path === '/api/admin/staff') {
    if (verb === 'GET') {
      return json(200, store.staff.map(publicStaff));
    }
    if (verb === 'POST') {
      return createStaff(store, { body, admin }, { json });
    }
  }
  const params = match(path, '/api/admin/staff/:id');
  if (verb === 'PATCH' && params) {
    return updateStaff(store, { id: params.id, body, admin }, { json });
  }
  return json(405, { error: 'Method not allowed' });
}
