import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../src/App.jsx';

describe('PiecePage', () => {
  it('shows carousel photos and details', async () => {
    render(
      <MemoryRouter initialEntries={['/collections/1']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Solitaire Halo Ring' }),
    ).toBeInTheDocument();
    expect(screen.getByText('GIA Certified')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show photo 2' }));
    expect(screen.getByRole('button', { name: 'Show photo 2' })).toHaveClass('active');
  });
});
