import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../../src/App.jsx';

describe('admin dashboard', () => {
  it('sets bar heights for the collections chart', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Collections — Last 6 Weeks')).toBeInTheDocument();
    const bars = document.querySelectorAll('.bar-chart .bar');
    expect(bars.length).toBeGreaterThan(0);
    bars.forEach((bar) => {
      expect(bar.style.height).toMatch(/%$/);
    });
  });

  it('keeps activity title and detail on separate lines', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Recent Activity')).toBeInTheDocument();
    const item = document.querySelector('.activity-item');
    const title = item.querySelector('b');
    const detail = item.querySelector('span');
    expect(title).toBeTruthy();
    expect(detail).toBeTruthy();
    expect(title.nextElementSibling).toBe(detail);
    expect(title.textContent).not.toContain(detail.textContent);
  });
});
