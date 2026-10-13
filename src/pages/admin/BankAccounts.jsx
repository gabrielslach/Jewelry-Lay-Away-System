import { useCallback, useEffect, useMemo, useState } from 'react';
import BankAccountModal from '../../components/BankAccountModal.jsx';
import Button from '../../components/Button.jsx';
import DataTable from '../../components/DataTable.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Modal from '../../components/Modal.jsx';
import Skeleton, { ListTableSkeleton } from '../../components/Skeleton.jsx';
import { useToast } from '../../components/useToast.js';
import {
  getAdminBankAccounts,
  updateAdminBankAccount,
} from '../../services/adminBankAccounts.js';
import { ServiceError } from '../../services/http.js';
import { isAdminRole } from '../../services/session.js';
import '../Account.css';
import '../AuthPage.css';
import './AdminList.css';

const HEADERS = ['Bank', 'Account name', 'Account number', 'QR', 'Status', ' '];

function errorText(err, fallback) {
  return err instanceof ServiceError ? err.message : fallback;
}

function QrCell({ account }) {
  const { bank_name: bank, qr_code_url: qr } = account;
  if (!qr) {
    return <span className="muted">—</span>;
  }
  return (
    <a
      className="qr-thumb"
      href={qr}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View ${bank} QR code`}
    >
      <img src={qr} alt={`${bank} QR code`} />
    </a>
  );
}

export default function BankAccounts() {
  const isAdmin = isAdminRole();
  const { showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deactivating, setDeactivating] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    getAdminBankAccounts()
      .then((data) => {
        setRows(data);
        setLoadError(null);
      })
      .catch((err) =>
        setLoadError(errorText(err, 'Unable to load bank accounts.')),
      )
      .finally(() => setLoading(false));
  }, [version]);

  const reload = useCallback(() => {
    setLoading(true);
    setVersion((v) => v + 1);
  }, []);

  const setActive = useCallback(
    async (account, isActive) => {
      setBusyId(account.id);
      setActionError(null);
      try {
        await updateAdminBankAccount(account.id, { is_active: isActive });
        setDeactivating(null);
        showToast(
          isActive ? 'Bank account activated.' : 'Bank account deactivated.',
        );
        reload();
      } catch (err) {
        setActionError(errorText(err, 'Unable to update the bank account.'));
      } finally {
        setBusyId(null);
      }
    },
    [reload, showToast],
  );

  function handleSaved() {
    setAdding(false);
    setEditing(null);
    showToast('Bank account saved.');
    reload();
  }

  const columns = useMemo(() => {
    const base = [
      {
        id: 'bank',
        header: 'Bank',
        accessorFn: (account) => account.bank_name,
        cell: ({ row }) => <b>{row.original.bank_name}</b>,
      },
      {
        id: 'account_name',
        header: 'Account name',
        enableSorting: false,
        accessorFn: (account) => account.account_name,
      },
      {
        id: 'account_number',
        header: 'Account number',
        enableSorting: false,
        accessorFn: (account) => account.account_number,
        cell: ({ row }) => (
          <span className="num-cell">{row.original.account_number}</span>
        ),
      },
      {
        id: 'qr',
        header: 'QR',
        enableSorting: false,
        accessorFn: (account) => account.qr_code_url,
        cell: ({ row }) => <QrCell account={row.original} />,
      },
      {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        accessorFn: (account) => account.is_active,
        cell: ({ row }) =>
          row.original.is_active ? (
            <span className="badge badge-ok">Active</span>
          ) : (
            <span className="badge badge-mute">Inactive</span>
          ),
      },
    ];
    if (!isAdmin) {
      return base;
    }
    return [
      ...base,
      {
        id: 'actions',
        header: ' ',
        enableSorting: false,
        cell: ({ row }) => {
          const account = row.original;
          const busy = busyId === account.id;
          return (
            <div className="row-actions">
              <Button
                variant="outline"
                size="sm"
                aria-label={`Edit ${account.bank_name}`}
                onClick={() => setEditing(account)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                aria-label={`${account.is_active ? 'Deactivate' : 'Activate'} ${account.bank_name}`}
                onClick={() =>
                  account.is_active
                    ? setDeactivating(account)
                    : setActive(account, true)
                }
              >
                {account.is_active
                  ? 'Deactivate'
                  : busy
                    ? 'Activating…'
                    : 'Activate'}
              </Button>
            </div>
          );
        },
      },
    ];
  }, [isAdmin, busyId, setActive]);

  return (
    <div className="panel">
      <div className="list-toolbar">
        <p className="page-lead">
          {isAdmin
            ? 'Accounts customers pay into. Only active accounts are shown at checkout.'
            : 'Accounts customers pay into. View only.'}
        </p>
        {isAdmin ? (
          <Button className="toolbar-action" onClick={() => setAdding(true)}>
            Add bank account
          </Button>
        ) : null}
      </div>
      <ErrorMessage>
        {loadError ?? (deactivating ? null : actionError)}
      </ErrorMessage>
      {loadError ? (
        <Button variant="outline" size="sm" onClick={reload}>
          Try again
        </Button>
      ) : null}
      {loading ? (
        <div className="table-wrap">
          <Skeleton>
            <ListTableSkeleton headers={HEADERS} />
          </Skeleton>
        </div>
      ) : null}
      {!loading && !loadError ? (
        <div className="table-wrap">
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => String(row.id)}
            emptyMessage={
              isAdmin
                ? 'No bank accounts yet. Add one so customers can pay.'
                : 'No bank accounts yet.'
            }
          />
        </div>
      ) : null}
      {adding || editing ? (
        <BankAccountModal
          account={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      ) : null}
      {deactivating ? (
        <Modal
          title="Deactivate this account?"
          onClose={() => setDeactivating(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setDeactivating(null)}>
                Cancel
              </Button>
              <Button
                disabled={busyId === deactivating.id}
                onClick={() => setActive(deactivating, false)}
              >
                {busyId === deactivating.id ? 'Deactivating…' : 'Deactivate'}
              </Button>
            </>
          }
        >
          <p>
            Customers will no longer see {deactivating.bank_name} when paying.
            You can activate it again later.
          </p>
          <ErrorMessage>{actionError}</ErrorMessage>
        </Modal>
      ) : null}
    </div>
  );
}
