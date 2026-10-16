import { getAdminSession } from '../services/session.js';

export default function AdminOnly({ message, children }) {
  const isAdmin = (getAdminSession()?.admin?.role ?? 'admin') === 'admin';
  if (!isAdmin) {
    return <div className="panel">{message}</div>;
  }
  return children;
}
