import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/useToast.js';
import { formatDisplayDate } from '../../lib/dates.js';
import { formatPesoDecimals } from '../../lib/money.js';
import {
  confirmAdminPayment,
  fetchPaymentProof,
  getAdminPendingPayments,
  rejectAdminPayment,
} from '../../services/adminPayments.js';
import { ServiceError } from '../../services/http.js';
import { getAdminSession } from '../../services/session.js';
import '../../components/Checkout.css';
import '../../components/PieceDetail.css';

function canReview() {
  const role = getAdminSession()?.admin?.role ?? 'admin';
  return role === 'admin' || role === 'receivables';
}

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

function revokeProofUrl(view) {
  if (view?.url?.startsWith('blob:')) {
    URL.revokeObjectURL(view.url);
  }
}

export default function PendingPayments() {
  const { showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(null);
  const [staffProof, setStaffProof] = useState(null);
  const [rejectInline, setRejectInline] = useState(null);
  const [proofView, setProofView] = useState(null);
  const reviewer = canReview();

  function refresh() {
    getAdminPendingPayments()
      .then(setRows)
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load pending payments.');
      });
  }

  useEffect(() => {
    refresh();
  }, []);

  function closeProof() {
    setProofView((prev) => {
      revokeProofUrl(prev);
      return null;
    });
  }

  async function viewProof(row) {
    setProofView((prev) => {
      revokeProofUrl(prev);
      return { loading: true, url: null, error: null };
    });
    try {
      const proof = await fetchPaymentProof(row.id);
      if (proof?.url) {
        setProofView({
          loading: false,
          url: proof.url,
          contentType: proof.content_type ?? proof.contentType ?? null,
          error: null,
        });
      } else {
        setProofView({ loading: false, url: null, error: 'No proof uploaded.' });
      }
    } catch {
      setProofView({ loading: false, url: null, error: 'No proof uploaded.' });
    }
  }

  async function handleConfirm() {
    try {
      const result = await confirmAdminPayment(confirmTarget.id, {
        note,
        confirmerProof: staffProof,
      });
      showToast(confirmMessage(result.reservation));
      setConfirmTarget(null);
      setNote('');
      setStaffProof(null);
      refresh();
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to confirm payment.');
    }
  }

  async function handleReject() {
    setReasonError(null);
    setRejectInline(null);
    if (!reason.trim()) {
      setReasonError('A reason is required.');
      return;
    }
    try {
      await rejectAdminPayment(rejectTarget.id, { reason: reason.trim(), confirmerProof: staffProof });
      showToast('Payment rejected.');
      setRejectTarget(null);
      setReason('');
      setStaffProof(null);
      refresh();
    } catch (err) {
      if (err instanceof ServiceError && err.status === 400) {
        setRejectInline(err.message);
        return;
      }
      setError(err instanceof ServiceError ? err.message : 'Unable to reject payment.');
    }
  }

  return (
    <div className="panel">
      <ErrorMessage>{error}</ErrorMessage>
      {!reviewer ? (
        <p className="page-lead">Only receivables and admins can confirm or reject.</p>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kind</th>
              <th>Plan</th>
              <th>Customer</th>
              <th>Term / due</th>
              <th>Amounts</th>
              <th>Reference</th>
              <th>Paid on</th>
              <th>Proof</th>
              <th> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.kind === 'down_payment' ? 'Down payment' : `Payment ${row.term_number}`}</td>
                <td>{row.plan_id}</td>
                <td>{row.customer_name}</td>
                <td>
                  {row.kind === 'installment'
                    ? `${row.term_number ? `Payment ${row.term_number}` : ''} ${formatDisplayDate(row.due_date)}`
                    : '—'}
                </td>
                <td>
                  {formatPesoDecimals(row.amount)} / {formatPesoDecimals(row.amount_submitted)}
                  {row.amount_mismatch ? (
                    <span className="badge badge-warn">Amounts differ</span>
                  ) : null}
                </td>
                <td>{row.reference_number}</td>
                <td>{formatDisplayDate(row.paid_on)}</td>
                <td>
                  <Button variant="outline" size="sm" onClick={() => viewProof(row)}>
                    View proof
                  </Button>
                </td>
                <td>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!reviewer}
                    onClick={() => setConfirmTarget(row)}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!reviewer}
                    onClick={() => setRejectTarget(row)}
                  >
                    Reject
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <p className="empty-copy">No payments waiting for confirmation.</p> : null}

      {proofView ? (
        <Modal
          title="Proof of payment"
          onClose={closeProof}
          footer={
            <Button variant="outline" onClick={closeProof}>
              Close
            </Button>
          }
        >
          {proofView.loading ? <p>Loading proof…</p> : null}
          {!proofView.loading && proofView.error ? (
            <p className="empty-copy">{proofView.error}</p>
          ) : null}
          {!proofView.loading && proofView.url && isImageProof(proofView.url, proofView.contentType) ? (
            <div className="proof-preview">
              <img src={proofView.url} alt="Proof of payment" />
            </div>
          ) : null}
          {!proofView.loading &&
          proofView.url &&
          !isImageProof(proofView.url, proofView.contentType) ? (
            <div className="plan-notice">
              <p>This proof cannot be previewed here.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(proofView.url, '_blank', 'noopener,noreferrer')}
              >
                Open in new tab
              </Button>
            </div>
          ) : null}
        </Modal>
      ) : null}

      {confirmTarget ? (
        <Modal
          title="Confirm payment"
          onClose={() => setConfirmTarget(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmTarget(null)}>
                Close
              </Button>
              <Button variant="primary" onClick={handleConfirm} disabled={!reviewer}>
                Confirm
              </Button>
            </>
          }
        >
          <div className="form-row">
            <label htmlFor="confirm-note">Note (staff only)</label>
            <textarea id="confirm-note" value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
          <div className="form-row">
            <label htmlFor="confirm-proof">Staff proof (optional)</label>
            <span className="field-hint">Only staff can see this.</span>
            <input
              id="confirm-proof"
              type="file"
              onChange={(event) => setStaffProof(event.target.files?.[0] ?? null)}
            />
          </div>
        </Modal>
      ) : null}

      {rejectTarget ? (
        <Modal
          title="Reject payment"
          onClose={() => setRejectTarget(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setRejectTarget(null)}>
                Close
              </Button>
              <Button variant="primary" onClick={handleReject} disabled={!reviewer}>
                Reject payment
              </Button>
            </>
          }
        >
          <ErrorMessage>{rejectInline}</ErrorMessage>
          <div className="form-row">
            <label htmlFor="reject-reason">Reason</label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            />
            {reasonError ? <p className="field-error">{reasonError}</p> : null}
          </div>
          <div className="form-row">
            <label htmlFor="reject-proof">Staff proof (optional)</label>
            <input
              id="reject-proof"
              type="file"
              onChange={(event) => setStaffProof(event.target.files?.[0] ?? null)}
            />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
