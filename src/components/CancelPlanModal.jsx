import { useState } from 'react';
import { cancelLayawayPlan } from '../services/cancelLayawayPlan.js';
import { ServiceError } from '../services/http.js';
import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import Modal from './Modal.jsx';

export default function CancelPlanModal({ planId, onClose, onCancelled }) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      await cancelLayawayPlan(planId);
      onCancelled();
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to cancel this plan.');
      setCancelling(false);
    }
  }

  return (
    <Modal
      title="Cancel this plan?"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" disabled={cancelling} onClick={onClose}>
            Keep plan
          </Button>
          <Button variant="danger" disabled={cancelling} onClick={handleCancel}>
            {cancelling ? 'Cancelling…' : 'Cancel plan'}
          </Button>
        </>
      }
    >
      <ErrorMessage>{error}</ErrorMessage>
      <p>This releases your reservation. This can&apos;t be undone.</p>
    </Modal>
  );
}
