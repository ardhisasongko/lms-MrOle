// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBookmarks } from './useBookmarks';

const mocks = vi.hoisted(() => ({
  auth: { user: { id: 'user-a' } },
  getBookmarksByUser: vi.fn(),
  getBookmarkReviews: vi.fn(),
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mocks.auth.user }),
}));
vi.mock('../services/bookmarks', () => ({
  getBookmarksByUser: mocks.getBookmarksByUser,
  getBookmarkReviews: mocks.getBookmarkReviews,
  addBookmark: mocks.addBookmark,
  removeBookmark: mocks.removeBookmark,
}));

function deferred() {
  let resolve;
  const promise = new Promise((res) => { resolve = res; });
  return { promise, resolve };
}

describe('useBookmarks ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.user = { id: 'user-a' };
    mocks.addBookmark.mockResolvedValue();
    mocks.removeBookmark.mockResolvedValue();
  });

  it('rejects interaction until the current user bookmark scope is loaded', async () => {
    mocks.getBookmarksByUser.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useBookmarks());

    await expect(result.current.toggleBookmark('question-1'))
      .rejects.toThrow('Bookmark masih dimuat. Silakan coba lagi.');
    expect(mocks.addBookmark).not.toHaveBeenCalled();
    expect(mocks.removeBookmark).not.toHaveBeenCalled();
  });

  it('does not let an old-user mutation change the new-user list', async () => {
    const removal = deferred();
    mocks.getBookmarksByUser
      .mockResolvedValueOnce([{ id: 'bookmark-a', question_id: 'question-1' }])
      .mockResolvedValueOnce([{ id: 'bookmark-b', question_id: 'question-1' }]);
    mocks.removeBookmark.mockReturnValue(removal.promise);
    const { result, rerender } = renderHook(() => useBookmarks());
    await waitFor(() => expect(result.current.bookmarks[0]?.id).toBe('bookmark-a'));

    let operation;
    act(() => { operation = result.current.toggleBookmark('question-1'); });
    await waitFor(() => expect(mocks.removeBookmark).toHaveBeenCalledWith('user-a', 'question-1'));

    mocks.auth.user = { id: 'user-b' };
    rerender();
    await waitFor(() => expect(result.current.bookmarks[0]?.id).toBe('bookmark-b'));

    await act(async () => { removal.resolve(); await operation; });
    expect(result.current.bookmarks[0]?.id).toBe('bookmark-b');
  });
});
