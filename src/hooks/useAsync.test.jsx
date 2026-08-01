// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAsync } from './useAsync';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a refetch promise that settles with the operation', async () => {
    const next = deferred();
    const fn = vi.fn()
      .mockResolvedValueOnce('initial')
      .mockImplementationOnce(() => next.promise);
    const { result } = renderHook(() => useAsync(fn, []));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let settled = false;
    let operation;
    await act(async () => {
      operation = result.current.refetch().then((value) => {
        settled = true;
        return value;
      });
      await Promise.resolve();
    });

    expect(settled).toBe(false);
    expect(result.current.loading).toBe(true);

    await act(async () => { next.resolve('refetched'); });
    await expect(operation).resolves.toBe('refetched');
    expect(result.current.loading).toBe(false);
  });

  it('keeps only the latest overlapping execution authoritative', async () => {
    const first = deferred();
    const second = deferred();
    const fn = vi.fn()
      .mockResolvedValueOnce('initial')
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const { result } = renderHook(() => useAsync(fn, []));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let firstOperation;
    let secondOperation;
    await act(async () => {
      firstOperation = result.current.refetch();
      secondOperation = result.current.refetch();
      await Promise.resolve();
    });

    await expect(firstOperation).resolves.toBeUndefined();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => { second.resolve('latest'); });
    await expect(secondOperation).resolves.toBe('latest');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('settles a superseded refetch even when its callback never settles', async () => {
    const latest = deferred();
    const fn = vi.fn()
      .mockResolvedValueOnce('initial')
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockImplementationOnce(() => latest.promise);
    const { result } = renderHook(() => useAsync(fn, []));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const staleOperation = result.current.refetch();
    const latestOperation = result.current.refetch();

    await expect(staleOperation).resolves.toBeUndefined();
    await act(async () => { latest.resolve('latest'); });
    await expect(latestOperation).resolves.toBe('latest');
  });

  it('aborts the active signal on dependency change and unmount', async () => {
    const signals = [];
    const fn = vi.fn((signal) => {
      signals.push(signal);
      return new Promise(() => {});
    });
    const { rerender, unmount } = renderHook(
      ({ dependency }) => useAsync(fn, [dependency]),
      { initialProps: { dependency: 'first' } },
    );
    await waitFor(() => expect(signals).toHaveLength(1));

    rerender({ dependency: 'second' });
    await waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);

    unmount();
    expect(signals[1].aborted).toBe(true);
  });

  it('keeps the existing string error contract', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Unable to load'));
    const { result } = renderHook(() => useAsync(fn, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Unable to load');
  });
});
