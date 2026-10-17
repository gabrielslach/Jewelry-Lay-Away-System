import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CancelPlanModal from '../../src/components/CancelPlanModal.jsx';
import * as cancelService from '../../src/services/cancelLayawayPlan.js';
import { ServiceError } from '../../src/services/http.js';

function renderModal(props = {}) {
  const handlers = { onClose: vi.fn(), onCancelled: vi.fn() };
  render(<CancelPlanModal planId="LA-9" {...handlers} {...props} />);
  return handlers;
}

describe('CancelPlanModal', () => {
  afterEach(() => vi.restoreAllMocks());

  it('asks for confirmation and keeps the plan on request', () => {
    const { onClose } = renderModal();
    expect(screen.getByRole('dialog', { name: 'Cancel this plan?' })).toBeInTheDocument();
    expect(
      screen.getByText("This releases your reservation. This can't be undone."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep plan' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('cancels the plan and reports success', async () => {
    const cancel = vi.spyOn(cancelService, 'cancelLayawayPlan').mockResolvedValue({});
    const { onCancelled } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel plan' }));
    await waitFor(() => expect(onCancelled).toHaveBeenCalled());
    expect(cancel).toHaveBeenCalledWith('LA-9');
  });

  it('shows the server 409 message and stays open', async () => {
    vi.spyOn(cancelService, 'cancelLayawayPlan').mockRejectedValue(
      new ServiceError('Your down payment is awaiting confirmation.', 409),
    );
    const { onCancelled } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel plan' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your down payment is awaiting confirmation.',
    );
    expect(onCancelled).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Cancel plan' })).toBeEnabled();
  });
});
