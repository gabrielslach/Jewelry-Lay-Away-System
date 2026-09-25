import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon } from '../theme/assets.js';
import { ToastContext } from './ToastContext.js';
import './toast.css';

const TOAST_MS = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef([]);

  useEffect(() => {
    const ids = timers.current;
    return () => {
      ids.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const showToast = useCallback((message) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message }]);
    const timerId = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_MS);
    timers.current.push(timerId);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-host" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div className="toast" key={toast.id}>
            <CheckIcon size={16} />
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
