import { useEffect, useState } from 'react';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { CashIcon, OrdersIcon, UsersIcon, WarnIcon } from '../../theme/icons.jsx';
import { formatPeso } from '../../lib/money.js';
import { ServiceError } from '../../services/http.js';
import { getAdminDashboard } from '../../services/getAdminDashboard.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch((err) => {
        setError(err instanceof ServiceError ? err.message : 'Unable to load dashboard.');
      });
  }, []);

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }
  if (!data) {
    return <p>Loading…</p>;
  }

  const kpis = [
    { icon: <OrdersIcon />, value: data.active_layaways, label: 'Active Lay-Aways' },
    { icon: <CashIcon />, value: formatPeso(data.collected_this_month), label: 'Collected This Month' },
    { icon: <WarnIcon />, value: data.overdue_payments, label: 'Overdue Payments' },
    { icon: <UsersIcon />, value: data.active_customers, label: 'Active Customers' },
  ];

  return (
    <>
      <div className="kpi-row">
        {kpis.map((kpi) => (
          <div className="kpi-card" key={kpi.label}>
            <div className="kpi-icon">{kpi.icon}</div>
            <b>{kpi.value}</b>
            <span>{kpi.label}</span>
          </div>
        ))}
      </div>
      <div className="two-col">
        <div className="panel">
          <h2>Collections — Last 6 Weeks</h2>
          <div className="bar-chart">
            {data.collections_last_6_weeks.map((height, index) => (
              <div className="bar" key={index}>
                <span style={{ '--h': `${height}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2>Recent Activity</h2>
          {data.recent_activity.map((item) => (
            <div className="activity-item" key={item.title}>
              <div>
                <b>{item.title}</b>
                <span>{item.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
