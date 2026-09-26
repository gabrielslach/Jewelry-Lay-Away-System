import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SessionProvider } from '../../src/components/SessionProvider.jsx';
import { useSession } from '../../src/components/useSession.js';

function Probe() {
  const { customer } = useSession();
  return <p>{customer ? customer.name : 'signed out'}</p>;
}

describe('useSession', () => {
  it('starts signed out', () => {
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    expect(screen.getByText('signed out')).toBeInTheDocument();
  });
});
