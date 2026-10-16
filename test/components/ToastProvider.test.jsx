import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../src/components/ToastProvider.jsx';
import { useToast } from '../../src/components/useToast.js';

function Trigger() {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast('Reservation submitted.')}>
      Notify
    </button>
  );
}

describe('ToastProvider', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows a toast message', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notify' }));
    expect(screen.getByText('Reservation submitted.')).toBeInTheDocument();
  });

  it('dismisses the toast after four seconds', async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notify' }));
    expect(screen.getByText('Reservation submitted.')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(4000);
    expect(screen.queryByText('Reservation submitted.')).not.toBeInTheDocument();
  });
});
