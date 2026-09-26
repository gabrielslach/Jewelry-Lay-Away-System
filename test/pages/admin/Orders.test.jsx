import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../../src/App.jsx';

describe('admin orders', () => {
  it('filters overdue plans and opens detail', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('LA-1001')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show Overdue orders' }));
    expect(await screen.findByText('LA-1002')).toBeInTheDocument();
    expect(screen.queryByText('LA-1001')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
