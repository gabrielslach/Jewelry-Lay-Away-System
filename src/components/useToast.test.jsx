import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToastProvider } from './ToastProvider.jsx';
import { useToast } from './useToast.js';

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
