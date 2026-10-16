import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LegalPage, { LegalSection } from '../../src/components/LegalPage.jsx';

describe('LegalPage', () => {
  it('renders title, date, notice, contents and sections', () => {
    render(
      <LegalPage title="Sample Terms" updated="January 1, 2026">
        <LegalSection id="one" title="First">
          <p>Body one</p>
        </LegalSection>
        <LegalSection id="two" title="Second">
          <p>Body two</p>
        </LegalSection>
      </LegalPage>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Sample Terms' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Last updated: January 1, 2026'),
    ).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(
      /Placeholder legal copy/,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'First' }),
    ).toHaveAttribute('id', 'one');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Second' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Second' })).toHaveAttribute(
      'href',
      '#two',
    );
  });
});
