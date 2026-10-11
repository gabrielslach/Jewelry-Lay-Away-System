import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Skeleton, { CustomersTableSkeleton } from '../../components/Skeleton.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/useToast.js';
import { formatDisplayDate } from '../../lib/dates.js';
import { ServiceError } from '../../services/http.js';
import { deleteAdminCustomerSessions } from '../../services/deleteAdminCustomerSessions.js';
import { getAdminCustomers } from '../../services/getAdminCustomers.js';
import '../Account.css';

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    getAdminCustomers()
      .then((data) => {
        setRows(data);
        setError(null);
      })
      .catch((err) => {
        setError(
          err instanceof ServiceError
            ? err.message
            : 'Unable to load customers.',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function askDelete(row) {
    setDeleteError(null);
    setPending(row);
  }

  function closeModal() {
    if (!deleting) {
      setPending(null);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAdminCustomerSessions(pending.id);
      showToast(`Signed ${pending.name} out of all devices.`);
      setPending(null);
    } catch (err) {
      setDeleteError(
        err instanceof ServiceError ? err.message : 'Unable to delete sessions.',
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="panel">
      <ErrorMessage>{error}</ErrorMessage>
      <div className="table-wrap">
        {loading ? (
          <Skeleton>
            <CustomersTableSkeleton />
          </Skeleton>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Active Lay-Aways</th>
                <th>Member Since</th>
                <th> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <b>{row.name}</b>
                  </td>
                  <td>{row.email}</td>
                  <td>{row.phone || '—'}</td>
                  <td>{row.active_layaways}</td>
                  <td>{formatDisplayDate(row.member_since) || '—'}</td>
                  <td>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Delete sessions for ${row.name}`}
                      onClick={() => askDelete(row)}
                    >
                      Delete sessions
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {pending ? (
        <Modal
          title="Delete sessions?"
          onClose={closeModal}
          footer={
            <>
              <Button variant="outline" disabled={deleting} onClick={closeModal}>
                Cancel
              </Button>
              <Button disabled={deleting} onClick={confirmDelete}>
                {deleting ? 'Deleting…' : 'Delete sessions'}
              </Button>
            </>
          }
        >
          <p>
            {pending.name} will be signed out on all devices and will need to
            log in again. This can&apos;t be undone.
          </p>
          <ErrorMessage>{deleteError}</ErrorMessage>
        </Modal>
      ) : null}
    </div>
  );
}
