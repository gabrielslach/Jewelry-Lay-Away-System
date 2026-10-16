import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReportBody from '../../src/components/ReportBody.jsx';

describe('ReportBody', () => {
  it('shows the loading text', () => {
    render(<ReportBody loading>content</ReportBody>);
    expect(screen.getByText('Loading report...')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows the error with a retry', () => {
    const onRetry = vi.fn();
    render(
      <ReportBody error="Boom" onRetry={onRetry}>
        content
      </ReportBody>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows the empty message or the content', () => {
    const { rerender } = render(
      <ReportBody empty emptyMessage="Nothing here.">
        content
      </ReportBody>,
    );
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    rerender(<ReportBody emptyMessage="Nothing here.">content</ReportBody>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
