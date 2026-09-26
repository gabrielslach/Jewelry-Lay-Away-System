import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../../src/App.jsx';

describe('admin settings', () => {
  it('saves business settings', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByDisplayValue('Sample Jewelry Co.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByText('Settings saved.')).toBeInTheDocument();
  });
});
