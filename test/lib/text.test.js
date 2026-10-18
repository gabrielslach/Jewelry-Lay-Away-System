import { describe, expect, it } from 'vitest';
import { firstSentence } from '../../src/lib/text.js';

describe('firstSentence', () => {
  it('returns text up to the first sentence end', () => {
    expect(firstSentence('Paid in full. Receipt sent.')).toBe('Paid in full.');
  });

  it('returns the whole text when there is no terminator', () => {
    expect(firstSentence('No punctuation here')).toBe('No punctuation here');
  });

  it('does not split on decimals', () => {
    expect(firstSentence('Paid 1.50 today. Thanks.')).toBe('Paid 1.50 today.');
  });
});
