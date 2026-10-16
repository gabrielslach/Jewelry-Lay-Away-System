import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Modal from '../../src/components/Modal.jsx';

describe('Modal', () => {
  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<Modal title="T" onClose={onClose}>Body</Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes only the topmost modal on Escape', () => {
    const onCloseBottom = vi.fn();
    const onCloseTop = vi.fn();
    render(
      <>
        <Modal title="Bottom" onClose={onCloseBottom}>A</Modal>
        <Modal title="Top" onClose={onCloseTop}>B</Modal>
      </>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseTop).toHaveBeenCalledTimes(1);
    expect(onCloseBottom).not.toHaveBeenCalled();
  });

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
