import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../../src/App.jsx';

describe('admin customers', () => {
  it('opens customer detail', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/customers']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Sample Shopper')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);
    expect(await screen.findByText(/900 000/)).toBeInTheDocument();
  });
});
