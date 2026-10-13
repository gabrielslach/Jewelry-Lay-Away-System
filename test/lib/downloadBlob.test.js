import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob } from '../../src/lib/downloadBlob.js';

describe('downloadBlob', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('clicks a temporary link with the file name', () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function () {
        expect(this.download).toBe('report.csv');
        expect(this.href).toMatch(/^blob:/);
      });
    downloadBlob(new Blob(['a']), 'report.csv');
    expect(click).toHaveBeenCalled();
  });

  it('attaches the link while clicking, then removes it and revokes later', () => {
    vi.useFakeTimers();
    const revoke = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function () {
        expect(document.body.contains(this)).toBe(true);
      },
    );
    downloadBlob(new Blob(['a']), 'report.csv');
    expect(document.querySelector('a[download]')).toBeNull();
    expect(revoke).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledTimes(1);
  });
});
