import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Skeleton, {
  CustomerDetailSkeleton,
  CustomersTableSkeleton,
} from '../../components/Skeleton.jsx';
import Modal from '../../components/Modal.jsx';
import { ServiceError } from '../../services/http.js';
import { getAdminCustomer } from '../../services/getAdminCustomer.js';
import { getAdminCustomers } from '../../services/getAdminCustomers.js';
import '../Account.css';

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    getAdminCustomers()
      .then((data) => {
        setRows(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load customers.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function openCustomer(row) {
    setDetail({ name: row.name });
    setDetailLoading(true);
    try {
      setDetail(await getAdminCustomer(row.id));
    } catch (err) {
      setDetail(null);
      setError(err instanceof ServiceError ? err.message : 'Unable to load customer.');
    } finally {
      setDetailLoading(false);
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
                  <td>{row.active_layaways}</td>
                  <td>{row.member_since}</td>
                  <td>
                    <Button variant="outline" size="sm" onClick={() => openCustomer(row)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {detail ? (
        <Modal
          title={detail.name}
          onClose={() => setDetail(null)}
          footer={
            <Button variant="outline" onClick={() => setDetail(null)}>
              Close
            </Button>
          }
        >
          {detailLoading ? (
            <Skeleton>
              <CustomerDetailSkeleton />
            </Skeleton>
          ) : (
            <div className="spec-grid">
              <div className="spec-item">
                <span>Email</span>
                <b>{detail.email}</b>
              </div>
              <div className="spec-item">
                <span>Mobile</span>
                <b>{detail.phone}</b>
              </div>
              <div className="spec-item">
                <span>Active Lay-Aways</span>
                <b>{detail.active_layaways}</b>
              </div>
              <div className="spec-item">
                <span>Member Since</span>
                <b>{detail.member_since}</b>
              </div>
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
