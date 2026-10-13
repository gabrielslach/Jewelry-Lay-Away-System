import { useState } from 'react';
import LedgerReport from '../../components/LedgerReport.jsx';
import ProfitReport from '../../components/ProfitReport.jsx';
import ReceivablesReport from '../../components/ReceivablesReport.jsx';
import Tabs from '../../components/Tabs.jsx';
import '../Account.css';
import '../AuthPage.css';
import './AdminList.css';

const TABS = [
  { id: 'receivables', label: 'Receivables', Panel: ReceivablesReport },
  { id: 'ledger', label: 'Ledger', Panel: LedgerReport },
  { id: 'profit', label: 'Profit', Panel: ProfitReport },
];

export default function Reports() {
  const [active, setActive] = useState('receivables');
  const { Panel } = TABS.find((tab) => tab.id === active);

  return (
    <div className="panel">
      <p className="page-lead">
        Receivables, ledger and profit. Export any view as CSV.
      </p>
      <Tabs label="Reports" tabs={TABS} active={active} onChange={setActive} />
      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
      >
        <Panel />
      </div>
    </div>
  );
}
