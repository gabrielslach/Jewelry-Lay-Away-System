import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PaymentReviewModal from '../../src/components/PaymentReviewModal.jsx';
import { ToastProvider } from '../../src/components/ToastProvider.jsx';
import * as adminPayments from '../../src/services/adminPayments.js';
import * as getLayawayPlanModule from '../../src/services/getLayawayPlan.js';
import { ServiceError } from '../../src/services/http.js';

const payment = {
  id: 11,
  kind: 'down_payment',
  plan_id: 'LA-1001',
  customer_name: 'Sample Client',
  amount: '14400',
  amount_submitted: '14000',
  amount_mismatch: 1,
  reference_number: 'BT-11',
  paid_on: '2026-10-09',
};

function setup({ reviewer = true, proof, plan } = {}) {
  vi.spyOn(adminPayments, 'fetchPaymentProof').mockImplementation(
    proof ??
      (() =>
        Promise.resolve({
          url: '/placeholders/1.svg',
          content_type: 'image/svg+xml',
        })),
  );
  vi.spyOn(getLayawayPlanModule, 'getLayawayPlan').mockImplementation(
    plan ??
      (() =>
        Promise.resolve({
          item_name: 'Pearl Ring',
          plan_label: '3 Mo. / 3 Payments',
          status: 'ok',
          reservation_status: 'reserved',
          installments: [
            { id: 1, term_number: 1, amount: 4800, status: 'pending' },
          ],
        })),
  );
  const onClose = vi.fn();
  const onDone = vi.fn();
  render(
    <ToastProvider>
      <PaymentReviewModal
        payment={payment}
        reviewer={reviewer}
        onClose={onClose}
        onDone={onDone}
      />
    </ToastProvider>,
  );
  return { onClose, onDone };
}

describe('PaymentReviewModal', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows payment details, proof and order details', async () => {
    setup();
    const dialog = await screen.findByRole('dialog', {
      name: 'Order #LA-1001',
    });
    expect(within(dialog).getByText('Payment details')).toBeInTheDocument();
    expect(within(dialog).getByText('Amounts differ')).toBeInTheDocument();
    expect(within(dialog).getByText('BT-11')).toBeInTheDocument();
    expect(
      await within(dialog).findByRole('img', { name: 'Proof of payment' }),
    ).toHaveAttribute('src', '/placeholders/1.svg');
    expect(await within(dialog).findByText('Pearl Ring')).toBeInTheDocument();
    expect(within(dialog).getByText('Reserved')).toBeInTheDocument();
    expect(within(dialog).getByText('Payment 1 of 1')).toBeInTheDocument();
  });

  it('shows a notice for non-image proof and opens it in a new tab', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    setup({
      proof: () =>
        Promise.resolve({
          url: '/files/proof.pdf',
          content_type: 'application/pdf',
        }),
    });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Open in new tab' }),
    );
    expect(openSpy).toHaveBeenCalledWith(
      '/files/proof.pdf',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('shows an empty message when there is no proof', async () => {
    setup({ proof: () => Promise.reject(new Error('none')) });
    expect(await screen.findByText('No proof uploaded.')).toBeInTheDocument();
  });

  it('revokes blob proof URLs on unmount', async () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    vi.spyOn(adminPayments, 'fetchPaymentProof').mockResolvedValue({
      url: 'blob:http://localhost/proof-1',
      content_type: 'image/png',
    });
    vi.spyOn(getLayawayPlanModule, 'getLayawayPlan').mockResolvedValue({
      installments: [],
    });
    const { unmount } = render(
      <ToastProvider>
        <PaymentReviewModal
          payment={payment}
          reviewer
          onClose={() => {}}
          onDone={() => {}}
        />
      </ToastProvider>,
    );
    await screen.findByRole('img', { name: 'Proof of payment' });
    unmount();
    expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/proof-1');
  });

  it('keeps actions usable when order details fail to load', async () => {
    const { onDone } = setup({ plan: () => Promise.reject(new Error('boom')) });
    expect(
      await screen.findByText('Unable to load order details.'),
    ).toBeInTheDocument();
    vi.spyOn(adminPayments, 'confirmAdminPayment').mockResolvedValue({
      reservation: null,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm payment' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it('confirms with a note and staff proof', async () => {
    const { onDone } = setup();
    const confirm = vi
      .spyOn(adminPayments, 'confirmAdminPayment')
      .mockResolvedValue({ reservation: { state: 'reserved' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    fireEvent.change(screen.getByLabelText('Note (staff only)'), {
      target: { value: 'ok' },
    });
    expect(screen.getByLabelText('Staff proof (optional)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm payment' }));
    await waitFor(() => {
      expect(confirm).toHaveBeenCalledWith(11, {
        note: 'ok',
        confirmerProof: null,
      });
    });
    expect(
      await screen.findByText('Payment confirmed. Piece reserved.'),
    ).toBeInTheDocument();
    expect(onDone).toHaveBeenCalled();
  });

  it('requires a reason to reject and shows a 400 error inline', async () => {
    const { onDone } = setup();
    const reject = vi
      .spyOn(adminPayments, 'rejectAdminPayment')
      .mockRejectedValue(new ServiceError('Reason too short', 400));
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reject payment' }));
    expect(screen.getByText('A reason is required.')).toBeInTheDocument();
    const reason = screen.getByLabelText('Reason for rejection');
    expect(reason).toHaveFocus();
    expect(reason.tagName).toBe('TEXTAREA');
    expect(reason).toHaveAttribute('rows', '4');
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(reason).toHaveAttribute(
      'placeholder',
      'Tell the customer why this payment was rejected',
    );
    expect(reject).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Reason for rejection'), {
      target: { value: 'blurry' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reject payment' }));
    expect(await screen.findByText('Reason too short')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('goes back from a form to the actions', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('button', { name: 'Reject' })).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Back' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Reason for rejection')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toHaveFocus();
  });

  it('shows a headed form per mode and focuses its first field', () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(
      screen.getByRole('heading', { name: 'Confirm this payment' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Add an optional note, then press Confirm payment.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Note (staff only)')).toHaveFocus();
    expect(scroll).toHaveBeenCalledWith({
      block: 'nearest',
      behavior: 'smooth',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    expect(
      screen.getByRole('heading', { name: 'Reject this payment' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Give a reason, then press Reject payment.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Reason for rejection')).toHaveFocus();
  });

  it('disables the form while submitting', async () => {
    const { onDone } = setup();
    let finish;
    vi.spyOn(adminPayments, 'rejectAdminPayment').mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    fireEvent.change(screen.getByLabelText('Reason for rejection'), {
      target: { value: 'blurry' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reject payment' }));
    expect(screen.getByRole('button', { name: 'Rejecting…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    expect(screen.getByLabelText('Reason for rejection')).toBeDisabled();
    expect(
      screen.getByRole('region', { name: 'Reject this payment' }),
    ).toHaveAttribute('aria-busy', 'true');
    finish({});
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it('ignores Escape and close controls while submitting', async () => {
    const { onClose, onDone } = setup();
    let finish;
    vi.spyOn(adminPayments, 'rejectAdminPayment').mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    fireEvent.change(screen.getByLabelText('Reason for rejection'), {
      target: { value: 'blurry' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reject payment' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).not.toHaveBeenCalled();
    finish({});
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it('re-enables the form after an API error', async () => {
    setup();
    vi.spyOn(adminPayments, 'confirmAdminPayment').mockRejectedValue(
      new ServiceError('Nope', 500),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm payment' }));
    expect(screen.getByRole('button', { name: 'Confirming…' })).toBeDisabled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Nope');
    expect(
      screen.getByRole('button', { name: 'Confirm payment' }),
    ).toBeEnabled();
  });

  it('disables Confirm and Reject for non-reviewers', async () => {
    setup({ reviewer: false });
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
    expect(
      screen.getByText('Only admins and accounting can confirm or reject.'),
    ).toBeInTheDocument();
  });
});
