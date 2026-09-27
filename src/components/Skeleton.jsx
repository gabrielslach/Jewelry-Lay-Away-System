import './Skeleton.css';

export default function Skeleton({ children, className = '' }) {
  const classes = className ? `skeleton ${className}` : 'skeleton';
  return (
    <div className={classes} aria-busy="true">
      <span className="skeleton-visually-hidden" role="status" aria-label="Loading">
        Loading
      </span>
      {children}
    </div>
  );
}

export function Bone({ className = '', ...props }) {
  const classes = className ? `skeleton-bone ${className}` : 'skeleton-bone';
  return <div className={classes} aria-hidden="true" {...props} />;
}

export function PieceCardSkeleton() {
  return (
    <article className="piece-card">
      <div className="piece-media">
        <Bone className="skeleton-bone-fill" />
      </div>
      <div className="piece-body">
        <Bone className="skeleton-bone-cat" />
        <Bone className="skeleton-bone-title" />
        <Bone className="skeleton-bone-price" />
      </div>
    </article>
  );
}

export function PieceCardSkeletonGrid({ count }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <PieceCardSkeleton key={index} />
      ))}
    </>
  );
}

export function PiecePageSkeleton() {
  return (
    <div className="piece-layout">
      <div className="carousel">
        <div className="carousel-main">
          <Bone className="skeleton-bone-fill" />
        </div>
        <div className="carousel-thumbs">
          <Bone className="skeleton-bone-thumb" />
          <Bone className="skeleton-bone-thumb" />
          <Bone className="skeleton-bone-thumb" />
        </div>
      </div>
      <div>
        <Bone className="skeleton-bone-cat" />
        <Bone className="skeleton-bone-title" style={{ height: 28, width: '85%' }} />
        <Bone className="skeleton-bone-modal-price" />
        <Bone className="skeleton-bone-price" style={{ width: '50%', marginBottom: 16 }} />
        <div className="spec-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="spec-item" key={index}>
              <Bone className="skeleton-bone-spec-label" />
              <Bone className="skeleton-bone-spec-value" />
            </div>
          ))}
        </div>
        <Bone className="skeleton-bone-btn" />
      </div>
    </div>
  );
}

export function PieceDetailModalSkeleton() {
  return (
    <>
      <div className="modal-media">
        <Bone className="skeleton-bone-fill" />
      </div>
      <Bone className="skeleton-bone-cat" />
      <Bone className="skeleton-bone-modal-price" />
      <div className="spec-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="spec-item" key={index}>
            <Bone className="skeleton-bone-spec-label" />
            <Bone className="skeleton-bone-spec-value" />
          </div>
        ))}
      </div>
      <div className="plan-box">
        <Bone className="skeleton-bone-plan-box-title" />
        <Bone className="skeleton-bone-plan-box-text" />
        <Bone className="skeleton-bone-plan-box-text-short" />
      </div>
    </>
  );
}

export function AccountActiveSkeleton() {
  return (
    <div className="plan-box">
      <Bone className="skeleton-bone-plan-title" />
      <Bone className="skeleton-bone-plan-meta" />
      <Bone className="skeleton-bone-schedule-row" />
      <Bone className="skeleton-bone-schedule-row" />
      <Bone className="skeleton-bone-schedule-row" />
    </div>
  );
}

export function AccountCompletedSkeleton() {
  return (
    <>
      <Bone className="skeleton-bone-completed-row" />
      <Bone className="skeleton-bone-completed-row" />
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <div className="kpi-row">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="kpi-card" key={index}>
            <Bone className="skeleton-bone-kpi-value" />
            <Bone className="skeleton-bone-kpi-label" />
          </div>
        ))}
      </div>
      <div className="two-col">
        <div className="panel">
          <h2>Collections — Last 6 Weeks</h2>
          <div className="bar-chart">
            {Array.from({ length: 6 }, (_, index) => (
              <Bone
                key={index}
                className="skeleton-bone-bar"
                style={{ height: `${40 + index * 8}%` }}
              />
            ))}
          </div>
        </div>
        <div className="panel">
          <h2>Recent Activity</h2>
          {Array.from({ length: 3 }, (_, index) => (
            <div className="activity-item" key={index}>
              <div>
                <Bone className="skeleton-bone-activity-title" />
                <Bone className="skeleton-bone-activity-detail" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function TableBodySkeletonRows({ columns, rows }) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr className="skeleton-table-row" key={rowIndex}>
          {Array.from({ length: columns }, (__, colIndex) => (
            <td key={colIndex}>
              <Bone className="skeleton-bone-cell" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function OrdersTableSkeleton() {
  return (
    <table>
      <thead>
        <tr>
          <th>Order</th>
          <th>Customer</th>
          <th>Item</th>
          <th>Plan</th>
          <th>Next Due</th>
          <th>Status</th>
          <th> </th>
        </tr>
      </thead>
      <tbody>
        <TableBodySkeletonRows columns={7} rows={5} />
      </tbody>
    </table>
  );
}

export function CustomersTableSkeleton() {
  return (
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
        <TableBodySkeletonRows columns={5} rows={5} />
      </tbody>
    </table>
  );
}

export function CustomerDetailSkeleton() {
  return (
    <div className="spec-grid">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="spec-item" key={index}>
          <Bone className="skeleton-bone-spec-label" />
          <Bone className="skeleton-bone-spec-value" />
        </div>
      ))}
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }, (_, index) => (
        <div className="form-row" key={index}>
          <Bone className="skeleton-bone-form-label" />
          <Bone className="skeleton-bone-form-input" />
        </div>
      ))}
      {Array.from({ length: 3 }, (_, index) => (
        <div className="toggle-row" key={index}>
          <Bone className="skeleton-bone-toggle-label" />
          <Bone className="skeleton-bone-switch" />
        </div>
      ))}
      <div style={{ marginTop: 18 }}>
        <Bone className="skeleton-bone-btn" />
      </div>
    </>
  );
}
