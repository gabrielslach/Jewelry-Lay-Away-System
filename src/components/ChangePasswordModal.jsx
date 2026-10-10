import { useState } from 'react';
import Button from './Button.jsx';
import ChangePasswordForm from './ChangePasswordForm.jsx';
import Modal from './Modal.jsx';

export default function ChangePasswordModal({ onSubmit, triggerLabel = 'Change password' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      {open ? (
        <Modal
          title="Change password"
          onClose={() => setOpen(false)}
          footer={
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          }
        >
          <ChangePasswordForm
            heading={null}
            onSuccess={() => setOpen(false)}
            onSubmit={onSubmit}
          />
        </Modal>
      ) : null}
    </>
  );
}
