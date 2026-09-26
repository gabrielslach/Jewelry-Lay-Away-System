import { useMemo, useState } from 'react';
import {
  clearCustomerSession,
  getCustomerSession,
  setCustomerSession,
} from '../services/session.js';
import { SessionContext } from './SessionContext.js';

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => getCustomerSession());
  const value = useMemo(
    () => ({
      session,
      customer: session?.customer ?? null,
      signIn(next) {
        setCustomerSession(next);
        setSession(next);
      },
      signOut() {
        clearCustomerSession();
        setSession(null);
      },
    }),
    [session],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
