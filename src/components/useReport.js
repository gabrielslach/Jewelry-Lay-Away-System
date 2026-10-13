import { useEffect, useState } from 'react';
import { getReport } from '../services/adminReports.js';
import { ServiceError } from '../services/http.js';

/** Loads a report; `filters` must keep the same identity until the query changes. */
export function useReport(report, filters) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({});

  useEffect(() => {
    let cancelled = false;
    const settle = (outcome) => {
      if (!cancelled) {
        setResult({ filters, version, ...outcome });
      }
    };
    getReport(report, filters)
      .then((data) => settle({ data }))
      .catch((err) =>
        settle({
          error:
            err instanceof ServiceError
              ? err.message
              : 'Unable to load the report.',
        }),
      );
    return () => {
      cancelled = true;
    };
  }, [report, filters, version]);

  const loading = result.filters !== filters || result.version !== version;
  return {
    loading,
    data: loading ? null : (result.data ?? null),
    error: loading ? null : (result.error ?? null),
    retry: () => setVersion((v) => v + 1),
  };
}
