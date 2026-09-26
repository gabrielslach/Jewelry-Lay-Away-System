import { useEffect, useState } from 'react';
import Button from '../../components/Button.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import Modal from '../../components/Modal.jsx';
import { ServiceError } from '../../services/http.js';
import { getAdminCustomer } from '../../services/getAdminCustomer.js';
import { getAdminCustomers } from '../../services/getAdminCustomers.js';
import '../Account.css';

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    getAdminCustomers()
      .then(setRows)
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load customers.');
      });
  }, []);

  async function openCustomer(id) {
    try {
      setDetail(await getAdminCustomer(id));
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'Unable to load customer.');
    }
  }

  return (
    <div className="panel">
      <ErrorMessage>{error}</ErrorMessage>
      <div className="table-wrap">
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
                  <Button variant="outline" size="sm" onClick={() => openCustomer(row.id)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        </Modal>
      ) : null}
    </div>
  );
}
