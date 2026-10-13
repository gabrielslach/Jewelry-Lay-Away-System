import { useEffect, useState } from 'react';
import AdminOnly from '../../components/AdminOnly.jsx';
import DataTable from '../../components/DataTable.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Skeleton, { ListTableSkeleton } from '../../components/Skeleton.jsx';
import { getBankAccounts } from '../../services/getBankAccounts.js';
import { ServiceError } from '../../services/http.js';
import '../AuthPage.css';
import './AdminList.css';

const HEADERS = ['Bank', 'Account name', 'Account number', 'QR code'];

const columns = [
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
    cell: ({ row }) => <span className="num-cell">{row.original.account_number}</span>,
  },
  {
    id: 'qr',
    header: 'QR code',
    enableSorting: false,
    accessorFn: (account) => account.qr_code_url,
    cell: ({ row }) => {
      const { bank_name: bank, qr_code_url: qr } = row.original;
      return qr ? (
        <a
          className="qr-thumb"
          href={qr}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${bank} QR code`}
        >
          <img src={qr} alt={`${bank} QR code`} />
        </a>
      ) : (
        '—'
      );
    },
  },
];

function BankAccountsList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBankAccounts()
      .then(setRows)
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load bank accounts.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel">
      <p className="page-lead">
        Bank accounts are managed by the provider for now. This list is read-only.
      </p>
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
            emptyMessage="No bank accounts yet."
          />
        </div>
      ) : null}
    </div>
  );
}

export default function BankAccounts() {
  return (
    <AdminOnly message="Only admins can view bank accounts.">
      <BankAccountsList />
    </AdminOnly>
  );
}
