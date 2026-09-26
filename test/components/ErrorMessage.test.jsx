import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ErrorMessage from '../../src/components/ErrorMessage.jsx';

describe('ErrorMessage', () => {
  it('exposes the message as an alert', () => {
    render(<ErrorMessage>Unable to load collections.</ErrorMessage>);
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load collections.');
  });
});
