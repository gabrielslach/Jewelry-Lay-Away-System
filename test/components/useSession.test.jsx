import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SessionProvider } from '../../src/components/SessionProvider.jsx';
import { useSession } from '../../src/components/useSession.js';
import { clearCustomerSession, setCustomerSession } from '../../src/services/session.js';

function Probe() {
  const { customer } = useSession();
  return <p>{customer ? customer.name : 'signed out'}</p>;
}

function renderProbe() {
  render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
}

const envelope = {
  access_token: 'a1',
  refresh_token: 'r1',
  customer: { id: 1, name: 'Sample Client' },
};

describe('useSession', () => {
  it('starts signed out', () => {
    renderProbe();
    expect(screen.getByText('signed out')).toBeInTheDocument();
  });

  it('is signed in on first paint in a new tab', () => {
    setCustomerSession(envelope);
    sessionStorage.clear();
    renderProbe();
    expect(screen.getByText('Sample Client')).toBeInTheDocument();
  });

  it('treats the legacy single-token session as signed out', () => {
    sessionStorage.setItem(
      'customerSession',
      JSON.stringify({ token: 'old', customer: { id: 1, name: 'Sample Client' } }),
    );
    renderProbe();
    expect(screen.getByText('signed out')).toBeInTheDocument();
  });

  it('follows session changes made outside React', () => {
    renderProbe();
    act(() => setCustomerSession(envelope));
    expect(screen.getByText('Sample Client')).toBeInTheDocument();
    act(() => clearCustomerSession());
    expect(screen.getByText('signed out')).toBeInTheDocument();
  });
});
