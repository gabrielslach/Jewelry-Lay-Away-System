import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Modal from '../../src/components/Modal.jsx';

describe('Modal', () => {
  it('renders title, body, and footer', () => {
    render(
      <Modal title="Piece Name" footer={<button type="button">Reserve</button>} onClose={() => {}}>
        Details
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Piece Name' })).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reserve' })).toBeInTheDocument();
  });

  it('closes from the close button', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Piece Name" onClose={onClose}>
        Details
      </Modal>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the footer outside the scrolling body', () => {
    const { container } = render(
      <Modal title="Piece Name" footer={<button type="button">Reserve</button>} onClose={() => {}}>
        Details
      </Modal>,
    );
    const body = container.querySelector('.modal-body');
    const foot = container.querySelector('.modal-foot');
    expect(body).toBeTruthy();
    expect(foot).toBeTruthy();
    expect(body.contains(foot)).toBe(false);
    expect(foot.previousElementSibling).toBe(body);
  });
});
