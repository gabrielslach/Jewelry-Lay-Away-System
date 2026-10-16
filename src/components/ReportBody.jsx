import Button from './Button.jsx';
import ErrorMessage from './ErrorMessage.jsx';

export default function ReportBody({
  loading,
  error,
  onRetry,
  empty,
  emptyMessage,
  children,
}) {
  if (loading) {
    return <p className="empty-copy">Loading report...</p>;
  }
  if (error) {
    return (
      <>
        <ErrorMessage>{error}</ErrorMessage>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </>
    );
  }
  if (empty) {
    return <p className="empty-copy">{emptyMessage}</p>;
  }
  return children;
}
