import { useEffect, useRef, useState } from 'react';
import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import InstallmentSchedule from './InstallmentSchedule.jsx';
import Modal from './Modal.jsx';
import ReservationBadge from './ReservationBadge.jsx';
import Skeleton, { Bone } from './Skeleton.jsx';
import { useToast } from './useToast.js';
import { formatDisplayDate } from '../lib/dates.js';
import { formatPesoDecimals } from '../lib/money.js';
import { paymentKindLabel, paymentDueDateLabel } from '../lib/paymentLabels.js';
import {
  confirmAdminPayment,
  fetchPaymentProof,
  rejectAdminPayment,
} from '../services/adminPayments.js';
import { getLayawayPlan } from '../services/getLayawayPlan.js';
import { ServiceError } from '../services/http.js';
import './Checkout.css';
import './PieceDetail.css';

function confirmMessage(reservation) {
  if (!reservation) {
    return 'Payment confirmed.';
  }
  if (reservation.action === 'complete') {
    return 'Payment confirmed. Plan completed.';
  }
  if (reservation.state === 'reserved') {
    return 'Payment confirmed. Piece reserved.';
  }
  if (reservation.state === 'waiting_for_stock') {
    return 'Payment confirmed. Waiting for stock.';
  }
  if (reservation.ok === false) {
    return `Payment confirmed. ${reservation.error ?? ''}`.trim();
  }
  return 'Payment confirmed.';
}

function isImageProof(url, contentType) {
  if (contentType?.startsWith('image/')) {
    return true;
  }
  return /\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(String(url ?? ''));
}

const REVIEW_COPY = {
  confirm: {
    title: 'Confirm this payment',
    hint: 'Add an optional note, then press Confirm payment.',
    submit: 'Confirm payment',
    busy: 'Confirming…',
  },
  reject: {
    title: 'Reject this payment',
    hint: 'Give a reason, then press Reject payment.',
    submit: 'Reject payment',
    busy: 'Rejecting…',
  },
};

function revokeProofUrl(url) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function SpecItem({ label, children }) {
  return (
    <div className="spec-item">
      <span>{label}</span>
      {children}
    </div>
  );
}

function ProofPreview({ proof }) {
  if (proof.loading) {
    return (
      <Skeleton>
        <Bone className="skeleton-bone-schedule-row" />
      </Skeleton>
    );
  }
  if (!proof.url) {
    return <p className="empty-copy">No proof uploaded.</p>;
  }
  if (isImageProof(proof.url, proof.contentType)) {
    return (
      <div className="proof-preview">
        <img src={proof.url} alt="Proof of payment" />
      </div>
    );
  }
  return (
    <div className="plan-notice">
      <p>This proof cannot be previewed here.</p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(proof.url, '_blank', 'noopener,noreferrer')}
      >
        Open in new tab
      </Button>
    </div>
  );
}

function OrderDetails({ payment, plan }) {
  return (
    <section className="order-details" aria-labelledby="order-details-title">
      <h4 id="order-details-title">Order details</h4>
      <div className="spec-grid">
        <SpecItem label="Customer">
          <b>{payment.customer_name}</b>
        </SpecItem>
        {plan.data?.item_name ? (
          <SpecItem label="Item">
            <b>{plan.data.item_name}</b>
          </SpecItem>
        ) : null}
        {plan.data?.plan_label ? (
          <SpecItem label="Plan">
            <b>{plan.data.plan_label}</b>
          </SpecItem>
        ) : null}
        {plan.data?.status === 'ok' || plan.data?.status === 'warn' ? (
          <SpecItem label="Status">
            <span
              className={
                plan.data.status === 'ok'
                  ? 'badge badge-ok'
                  : 'badge badge-warn'
              }
            >
              {plan.data.status === 'ok' ? 'On Track' : 'Overdue'}
            </span>
          </SpecItem>
        ) : null}
        {plan.data?.reservation_status &&
        plan.data.reservation_status !== 'none' ? (
          <SpecItem label="Reservation">
            <ReservationBadge status={plan.data.reservation_status} />
          </SpecItem>
        ) : null}
      </div>
      {plan.loading ? (
        <Skeleton>
          <Bone className="skeleton-bone-schedule-row" />
          <Bone className="skeleton-bone-schedule-row" />
        </Skeleton>
      ) : null}
      {plan.error ? <p className="empty-copy">{plan.error}</p> : null}
      {plan.data ? (
        <InstallmentSchedule
          installments={(plan.data.installments ?? []).filter(
            (row) => row.status !== 'superseded',
          )}
        />
      ) : null}
    </section>
  );
}

export default function PaymentReviewModal({
  payment,
  reviewer,
  onClose,
  onDone,
}) {
  const { showToast } = useToast();
  const [proof, setProof] = useState({
    loading: true,
    url: null,
    contentType: null,
  });
  const [plan, setPlan] = useState({ loading: true, data: null, error: null });
  const [mode, setMode] = useState(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [staffProof, setStaffProof] = useState(null);
  const [reasonError, setReasonError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef(null);
  const firstFieldRef = useRef(null);
  const openerId = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let loadedUrl = null;
    fetchPaymentProof(payment.id)
      .then((result) => {
        if (cancelled) {
          revokeProofUrl(result?.url);
          return;
        }
        loadedUrl = result?.url ?? null;
        setProof({
          loading: false,
          url: loadedUrl,
          contentType: result?.content_type ?? result?.contentType ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setProof({ loading: false, url: null, contentType: null });
        }
      });
    return () => {
      cancelled = true;
      revokeProofUrl(loadedUrl);
    };
  }, [payment.id]);

  useEffect(() => {
    let cancelled = false;
    getLayawayPlan(payment.plan_id)
      .then((data) => {
        if (!cancelled) {
          setPlan({ loading: false, data, error: null });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlan({
            loading: false,
            data: null,
            error: 'Unable to load order details.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [payment.plan_id]);

  useEffect(() => {
    if (mode) {
      scrollPanelIntoView();
      firstFieldRef.current?.focus({ preventScroll: true });
    } else {
      document.getElementById(openerId.current)?.focus();
    }
  }, [mode]);

  function scrollPanelIntoView() {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    panelRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: reduced ? 'auto' : 'smooth',
    });
  }

  function openForm(nextMode) {
    openerId.current = `review-open-${nextMode}`;
    setMode(nextMode);
    setStaffProof(null);
    setReasonError(null);
    setFormError(null);
  }

  async function submit() {
    setReasonError(null);
    setFormError(null);
    if (mode === 'reject' && !reason.trim()) {
      setReasonError('A reason is required.');
      firstFieldRef.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'confirm') {
        const result = await confirmAdminPayment(payment.id, {
          note,
          confirmerProof: staffProof,
        });
        showToast(confirmMessage(result.reservation));
      } else {
        await rejectAdminPayment(payment.id, {
          reason: reason.trim(),
          confirmerProof: staffProof,
        });
        showToast('Payment rejected.');
      }
    } catch (err) {
      const fallback =
        mode === 'confirm'
          ? 'Unable to confirm payment.'
          : 'Unable to reject payment.';
      setFormError(err instanceof ServiceError ? err.message : fallback);
      setSubmitting(false);
      scrollPanelIntoView();
      return;
    }
    onDone();
  }

  const copy = REVIEW_COPY[mode];

  const footer =
    mode === null ? (
      <div className="review-actions">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button
          id="review-open-reject"
          variant="outline"
          disabled={!reviewer}
          onClick={() => openForm('reject')}
        >
          Reject
        </Button>
        <Button
          id="review-open-confirm"
          variant="primary"
          disabled={!reviewer}
          onClick={() => openForm('confirm')}
        >
          Confirm
        </Button>
      </div>
    ) : (
      <div className="review-actions">
        <Button
          variant="outline"
          disabled={submitting}
          onClick={() => setMode(null)}
        >
          Back
        </Button>
        <Button
          variant={mode === 'reject' ? 'danger' : 'primary'}
          disabled={submitting}
          onClick={submit}
        >
          {submitting ? copy.busy : copy.submit}
        </Button>
      </div>
    );

  return (
    <Modal
      title={`Order #${payment.plan_id}`}
      onClose={submitting ? () => {} : onClose}
      footer={footer}
    >
      <section
        className="payment-highlight"
        aria-labelledby="payment-details-title"
      >
        <h4 id="payment-details-title">Payment details</h4>
        <div className="payment-highlight-amount">
          <strong>{formatPesoDecimals(payment.amount_submitted)}</strong>
          <span>Expected {formatPesoDecimals(payment.amount)}</span>
          {payment.amount_mismatch ? (
            <span className="badge badge-warn">Amounts differ</span>
          ) : null}
        </div>
        <div className="spec-grid">
          <SpecItem label="Kind">
            <b>{paymentKindLabel(payment)}</b>
          </SpecItem>
          <SpecItem label="Due date">
            <b>{paymentDueDateLabel(payment)}</b>
          </SpecItem>
          <SpecItem label="Reference number">
            <b>{payment.reference_number}</b>
          </SpecItem>
          <SpecItem label="Paid on">
            <b>{formatDisplayDate(payment.paid_on)}</b>
          </SpecItem>
        </div>
        <ProofPreview proof={proof} />
      </section>

      <OrderDetails payment={payment} plan={plan} />

      {!reviewer ? (
        <p className="page-lead">
          Only admins and accounting can confirm or reject.
        </p>
      ) : null}

      {mode ? (
        <section
          className="review-panel"
          ref={panelRef}
          aria-labelledby="review-title"
          aria-live="polite"
          aria-busy={submitting}
        >
          <h4 id="review-title">{copy.title}</h4>
          <p className="field-hint">{copy.hint}</p>
          <ErrorMessage>{formError}</ErrorMessage>
          {mode === 'confirm' ? (
            <div className="form-row">
              <label htmlFor="review-note">Note (staff only)</label>
              <textarea
                id="review-note"
                ref={firstFieldRef}
                disabled={submitting}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          ) : (
            <div className="form-row">
              <label htmlFor="review-reason">Reason for rejection</label>
              <textarea
                id="review-reason"
                ref={firstFieldRef}
                rows={4}
                placeholder="Tell the customer why this payment was rejected"
                disabled={submitting}
                value={reason}
                aria-invalid={reasonError ? 'true' : undefined}
                onChange={(event) => setReason(event.target.value)}
                required
              />
              {reasonError ? (
                <p className="field-error">{reasonError}</p>
              ) : null}
            </div>
          )}
          <div className="form-row">
            <label htmlFor="review-proof">Staff proof (optional)</label>
            <span className="field-hint">Only staff can see this.</span>
            <input
              id="review-proof"
              type="file"
              disabled={submitting}
              onChange={(event) =>
                setStaffProof(event.target.files?.[0] ?? null)
              }
            />
          </div>
        </section>
      ) : null}
    </Modal>
  );
}
