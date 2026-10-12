import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../src/App.jsx';

describe('TermsPage', () => {
  it('renders at /terms, links the privacy policy and scrolls to top', () => {
    render(
      <MemoryRouter initialEntries={['/terms']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Terms and Conditions' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Lay-away plans' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/\[maximum term\]/)).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'On this page' });
    expect(nav).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'Privacy Policy' });
    expect(links.some((link) => link.getAttribute('href') === '/privacy')).toBe(
      true,
    );
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
