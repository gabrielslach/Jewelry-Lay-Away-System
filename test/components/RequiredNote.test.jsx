import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RequiredNote from '../../src/components/RequiredNote.jsx';

describe('RequiredNote', () => {
  it('explains the asterisk', () => {
    render(<RequiredNote />);
    expect(screen.getByText('* Required')).toBeInTheDocument();
  });
});
