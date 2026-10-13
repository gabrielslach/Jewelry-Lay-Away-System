import { useEffect, useMemo, useState } from 'react';
import AddStaffModal from '../../components/AddStaffModal.jsx';
import AdminOnly from '../../components/AdminOnly.jsx';
import Button from '../../components/Button.jsx';
import DataTable from '../../components/DataTable.jsx';
import EditStaffModal from '../../components/EditStaffModal.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Skeleton, { ListTableSkeleton } from '../../components/Skeleton.jsx';
import { useToast } from '../../components/useToast.js';
import { formatDisplayDate } from '../../lib/dates.js';
import { activeCounts, fullRoles, ROLE_CAPS, ROLE_LABELS } from '../../lib/staffRoles.js';
import { getAdminStaff } from '../../services/getAdminStaff.js';
import { ServiceError } from '../../services/http.js';
import {
  getAdmin,
  getAdminRefreshToken,
  getAdminToken,
  setAdminSession,
} from '../../services/session.js';
import '../Account.css';
import './AdminList.css';

const HEADERS = ['Name', 'Email', 'Role', 'Status', 'Created', ' '];

function StaffList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const { showToast } = useToast();
  const me = getAdmin();

  const [version, setVersion] = useState(0);

  useEffect(() => {
    getAdminStaff()
      .then((data) => {
        setRows(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load staff.');
      })
      .finally(() => setLoading(false));
  }, [version]);

  const counts = activeCounts(rows);
  const full = fullRoles(counts);

  function handleAdded() {
    setAdding(false);
    showToast('Staff added.');
    setVersion((v) => v + 1);
  }

  function handleUpdated(saved) {
    if (saved.id === me?.id) {
      setAdminSession({
        access_token: getAdminToken(),
        refresh_token: getAdminRefreshToken(),
        admin: { ...me, name: saved.name, role: saved.role },
      });
    }
    setEditing(null);
    showToast('Staff updated.');
    setVersion((v) => v + 1);
  }

  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (member) => member.name,
        cell: ({ row }) => (
          <>
            <b>{row.original.name}</b>
            {row.original.id === me?.id ? <span className="muted"> (you)</span> : null}
          </>
        ),
      },
      {
        id: 'email',
        header: 'Email',
        enableSorting: false,
        accessorFn: (member) => member.email,
      },
      {
        id: 'role',
        header: 'Role',
        accessorFn: (member) => ROLE_LABELS[member.role] ?? member.role,
      },
      {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        accessorFn: (member) => member.is_active,
        cell: ({ row }) =>
          row.original.is_active ? (
            <span className="badge badge-ok">Active</span>
          ) : (
            <span className="badge badge-mute">Inactive</span>
          ),
      },
      {
        id: 'created',
        header: 'Created',
        accessorFn: (member) => member.created_at,
        cell: ({ row }) => formatDisplayDate(row.original.created_at) || '—',
      },
      {
        id: 'actions',
        header: ' ',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            aria-label={`Edit ${row.original.name}`}
            onClick={() => setEditing(row.original)}
          >
            Edit
          </Button>
        ),
      },
    ],
    [me?.id],
  );

  const editingIsLastAdmin =
    editing?.role === 'admin' &&
    editing.is_active &&
    counts.admin === 1 &&
    editing.id !== me?.id;

  return (
    <div className="panel">
      <div className="list-toolbar">
        <p>
          Admins {counts.admin} of {ROLE_CAPS.admin} · Accounting {counts.accounting} of{' '}
          {ROLE_CAPS.accounting}
        </p>
        <Button onClick={() => setAdding(true)}>Add staff</Button>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? (
        <div className="table-wrap">
          <Skeleton>
            <ListTableSkeleton headers={HEADERS} />
          </Skeleton>
        </div>
      ) : null}
      {!loading && !error ? (
        <div className="table-wrap">
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => String(row.id)}
            emptyMessage="No staff yet."
          />
        </div>
      ) : null}
      {adding ? (
        <AddStaffModal full={full} onClose={() => setAdding(false)} onSaved={handleAdded} />
      ) : null}
      {editing ? (
        <EditStaffModal
          member={editing}
          isSelf={editing.id === me?.id}
          isLastAdmin={editingIsLastAdmin}
          full={full}
          onClose={() => setEditing(null)}
          onSaved={handleUpdated}
        />
      ) : null}
    </div>
  );
}

export default function Staff() {
  return (
    <AdminOnly message="Only admins can manage staff.">
      <StaffList />
    </AdminOnly>
  );
}
