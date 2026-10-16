import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToastProvider } from '../../src/components/ToastProvider.jsx';
import { useToast } from '../../src/components/useToast.js';

describe('useToast', () => {
  it('returns showToast inside the provider', () => {
    function Probe() {
      const { showToast } = useToast();
      return <span>{typeof showToast}</span>;
    }
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );
    expect(screen.getByText('function')).toBeInTheDocument();
  });
});
