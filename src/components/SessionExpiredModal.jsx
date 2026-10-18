import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearAdminSession, clearCustomerSession } from '../services/session.js';
import { subscribeSessionExpired } from '../services/sessionExpired.js';
import Button from './Button.jsx';
import Modal from './Modal.jsx';

const scopes = {
  customer: { clearSession: clearCustomerSession, loginPath: '/login' },
  admin: { clearSession: clearAdminSession, loginPath: '/admin/login' },
};

export default function SessionExpiredModal({ scope }) {
  const [open, setOpen] = useState(false);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { clearSession, loginPath } = scopes[scope];

  useEffect(() => subscribeSessionExpired(scope, () => setOpen(true)), [scope]);

  if (!open) {
    return null;
  }

  function signIn() {
    clearSession();
    setOpen(false);
    navigate(`${loginPath}?from=${encodeURIComponent(`${pathname}${search}`)}`);
  }

  return (
    <Modal
      title="Sign in to continue"
      dismissible={false}
      onClose={() => {}}
      footer={<Button onClick={signIn}>Sign in</Button>}
    >
      <p>Your session has expired. Please sign in again to continue.</p>
    </Modal>
  );
}
