import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../src/App.jsx';

describe('PrivacyPage', () => {
  it('renders at /privacy, links the terms and scrolls to top', () => {
    render(
      <MemoryRouter initialEntries={['/privacy']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Privacy Policy' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Information we collect' }),
    ).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'Terms and Conditions' });
    expect(links.some((link) => link.getAttribute('href') === '/terms')).toBe(
      true,
    );
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
