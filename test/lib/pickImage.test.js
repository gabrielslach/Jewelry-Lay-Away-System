import { describe, expect, it } from 'vitest';
import { pickImage } from '../../src/lib/pickImage.js';

describe('pickImage', () => {
  const image = { url: 'o.jpg', thumb_url: 't.jpg', web_url: 'w.jpg' };

  it('returns the size-specific url', () => {
    expect(pickImage(image, 'thumb')).toBe('t.jpg');
    expect(pickImage(image, 'web')).toBe('w.jpg');
  });

  it('falls back to the original url', () => {
    expect(pickImage({ url: 'o.jpg' }, 'thumb')).toBe('o.jpg');
    expect(pickImage({ url: 'o.jpg' }, 'web')).toBe('o.jpg');
  });

  it('returns undefined without an image', () => {
    expect(pickImage(undefined, 'web')).toBeUndefined();
  });
});
