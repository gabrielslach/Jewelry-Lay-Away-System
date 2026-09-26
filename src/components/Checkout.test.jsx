import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Checkout from './Checkout.jsx';

const piece = { id: 1, name: 'Solitaire Halo Ring', price: 48000 };

describe('Checkout', () => {
  it('shows six payments for the three-month term', () => {
    render(<Checkout piece={piece} onClose={() => {}} />);
    expect(screen.getAllByLabelText(/Payment \d+ date/)).toHaveLength(6);
    expect(screen.getAllByText('₱8,000')).toHaveLength(6);
  });

  it('rebuilds the schedule when the term changes', () => {
    render(<Checkout piece={piece} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Lay-Away Term'), { target: { value: '2' } });
    expect(screen.getAllByLabelText(/Payment \d+ date/)).toHaveLength(2);
  });

  it('puts remainder pesos on the last installment', () => {
    render(
      <Checkout
        piece={{ id: 1, name: 'Solitaire Halo Ring', price: 48500 }}
        onClose={() => {}}
      />,
    );
    expect(screen.getAllByText('₱8,083')).toHaveLength(5);
    expect(screen.getByText('₱8,085')).toBeInTheDocument();
  });

  it('creates a mocked plan on continue', async () => {
    const onScheduled = vi.fn();
    render(<Checkout piece={piece} onClose={() => {}} onScheduled={onScheduled} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await vi.waitFor(() => {
      expect(onScheduled).toHaveBeenCalled();
    });
    expect(onScheduled.mock.calls[0][0].plan.term_months).toBe(3);
  });

  it('lets the shopper pick a mocked payment method', async () => {
    const onPayMethod = vi.fn();
    render(<Checkout piece={piece} onClose={() => {}} onPayMethod={onPayMethod} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('GCash / E-Wallet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Bank Transfer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onPayMethod).toHaveBeenCalledWith('bank');
  });
});
