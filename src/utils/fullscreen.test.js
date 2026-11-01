import { describe, expect, it, vi } from 'vitest';
import {
  enterFullscreen,
  exitFullscreen,
  getFullscreenElement,
  isFullscreenActive,
  isFullscreenSupported,
  toggleFullscreen,
} from './fullscreen';

function fakeDoc({ supported = true, active = false, reject = false } = {}) {
  const doc = {
    fullscreenElement: active ? {} : null,
    exitFullscreen: vi.fn(async () => {
      if (reject) throw new Error('ditolak');
      doc.fullscreenElement = null;
    }),
    documentElement: {},
  };
  if (supported) {
    doc.documentElement.requestFullscreen = vi.fn(async () => {
      if (reject) throw new Error('ditolak');
      doc.fullscreenElement = {};
    });
  }
  return doc;
}

describe('isFullscreenSupported', () => {
  it('true bila documentElement punya requestFullscreen', () => {
    expect(isFullscreenSupported(fakeDoc())).toBe(true);
  });

  it('false bila API tidak ada (mis. iPhone Safari)', () => {
    expect(isFullscreenSupported(fakeDoc({ supported: false }))).toBe(false);
    expect(isFullscreenSupported(null)).toBe(false);
    expect(isFullscreenSupported({})).toBe(false);
  });
});

describe('getFullscreenElement / isFullscreenActive', () => {
  it('mencerminkan fullscreenElement dokumen', () => {
    const active = fakeDoc({ active: true });
    expect(getFullscreenElement(active)).toBe(active.fullscreenElement);
    expect(isFullscreenActive(active)).toBe(true);
    expect(isFullscreenActive(fakeDoc())).toBe(false);
    expect(getFullscreenElement(null)).toBeNull();
  });
});

describe('enterFullscreen / exitFullscreen', () => {
  it('masuk layar penuh memanggil requestFullscreen pada documentElement', async () => {
    const doc = fakeDoc();
    await expect(enterFullscreen(doc)).resolves.toBe(true);
    expect(doc.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('keluar layar penuh hanya bila sedang aktif', async () => {
    const doc = fakeDoc({ active: true });
    await expect(exitFullscreen(doc)).resolves.toBe(true);
    expect(doc.exitFullscreen).toHaveBeenCalledTimes(1);
    await expect(exitFullscreen(fakeDoc())).resolves.toBe(false);
  });

  it('penolakan browser ditelan dengan aman (false, bukan throw)', async () => {
    await expect(enterFullscreen(fakeDoc({ reject: true }))).resolves.toBe(false);
    await expect(exitFullscreen(fakeDoc({ active: true, reject: true }))).resolves.toBe(false);
    await expect(enterFullscreen(fakeDoc({ supported: false }))).resolves.toBe(false);
  });
});

describe('toggleFullscreen', () => {
  it('beralih sesuai keadaan saat ini', async () => {
    const doc = fakeDoc();
    await expect(toggleFullscreen(doc)).resolves.toBe(true);
    expect(doc.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
    await expect(toggleFullscreen(doc)).resolves.toBe(true);
    expect(doc.exitFullscreen).toHaveBeenCalledTimes(1);
  });
});
