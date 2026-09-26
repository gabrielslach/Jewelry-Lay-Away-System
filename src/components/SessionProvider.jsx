import { useEffect, useMemo, useState } from 'react';
import { getCustomer, subscribeCustomerSession } from '../services/session.js';
import { SessionContext } from './SessionContext.js';

export function SessionProvider({ children }) {
  const [customer, setCustomer] = useState(getCustomer);
  useEffect(() => subscribeCustomerSession(() => setCustomer(getCustomer())), []);
  const value = useMemo(() => ({ customer }), [customer]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
