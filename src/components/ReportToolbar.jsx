import { useState } from 'react';
import { downloadBlob } from '../lib/downloadBlob.js';
import { exportReportCsv } from '../services/adminReports.js';
import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import './Checkout.css';
import './ReportToolbar.css';

export default function ReportToolbar({ report, exportFilters, children }) {
  const [exporting, setExporting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleExport() {
    setExporting(true);
    setFailed(false);
    try {
      const { blob, filename } = await exportReportCsv(report, exportFilters);
      downloadBlob(blob, filename);
    } catch {
      setFailed(true);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="report-toolbar">
        <div className="report-filters">{children}</div>
        <Button
          variant="outline"
          className="report-export"
          disabled={exporting}
          onClick={handleExport}
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>
      <ErrorMessage>
        {failed ? 'Could not export. Try again.' : null}
      </ErrorMessage>
    </>
  );
}
