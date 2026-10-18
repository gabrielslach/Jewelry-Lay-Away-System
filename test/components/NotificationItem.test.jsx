import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NotificationItem from '../../src/components/NotificationItem.jsx';

const item = { id: 4, title: 'Heads up', body: 'Plan paid.', created_at: '2026-10-09T12:00:00Z' };

describe('NotificationItem', () => {
  it('marks an unread item read by id', () => {
    const onMarkRead = vi.fn();
    render(<ul><NotificationItem item={item} onMarkRead={onMarkRead} /></ul>);
    fireEvent.click(screen.getByRole('button', { name: 'Mark read' }));
    expect(onMarkRead).toHaveBeenCalledWith(4);
  });

  it('dims a read item and drops the button', () => {
    render(
      <ul>
        <NotificationItem item={{ ...item, read_at: '2026-10-10T00:00:00Z' }} onMarkRead={vi.fn()} />
      </ul>,
    );
    expect(screen.getByRole('listitem')).toHaveClass('read');
    expect(screen.queryByRole('button', { name: 'Mark read' })).not.toBeInTheDocument();
  });

  it('shows only the first sentence until expanded', () => {
    const long = { ...item, body: 'Your plan is due soon. Schedule:\n1. Oct 1 - 100' };
    render(<ul><NotificationItem item={long} onMarkRead={vi.fn()} /></ul>);
    expect(screen.getByText('Your plan is due soon.')).toBeInTheDocument();
    expect(screen.queryByText(/Schedule/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.getByText(/Schedule/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.queryByText(/Schedule/)).not.toBeInTheDocument();
  });
});
