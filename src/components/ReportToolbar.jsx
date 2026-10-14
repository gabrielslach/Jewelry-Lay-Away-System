import { useState } from 'react';
import { downloadBlob } from '../lib/downloadBlob.js';
import { exportReportCsv } from '../services/adminReports.js';
import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import './Checkout.css';
import './ReportToolbar.css';

const SERVER_MESSAGE_STATUSES = [400, 401, 403];

function exportErrorMessage(error) {
  if (SERVER_MESSAGE_STATUSES.includes(error.status) && error.message) {
    return error.message;
  }
  return 'Could not export. Try again.';
}

export default function ReportToolbar({ report, exportFilters, children }) {
  const [exporting, setExporting] = useState(false);
  const [failure, setFailure] = useState(null);

  async function handleExport() {
    setExporting(true);
    setFailure(null);
    try {
      const { blob, filename } = await exportReportCsv(report, exportFilters);
      downloadBlob(blob, filename);
    } catch (error) {
      setFailure(error);
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
        {failure ? exportErrorMessage(failure) : null}
      </ErrorMessage>
    </>
  );
}
